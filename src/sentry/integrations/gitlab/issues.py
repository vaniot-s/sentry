from __future__ import absolute_import

import re

from django.core.urlresolvers import reverse
from sentry.integrations.exceptions import ApiError, IntegrationError, ApiUnauthorized
from sentry.integrations.issues import IssueBasicMixin
from sentry.utils.http import absolute_uri

ISSUE_EXTERNAL_KEY_FORMAT = re.compile(r".+:(.+)#(.+)")


class GitlabIssueBasic(IssueBasicMixin):
    def make_external_key(self, data):
        return u"{}:{}".format(self.model.metadata["domain_name"], data["key"])

    def get_issue_url(self, key):
        match = ISSUE_EXTERNAL_KEY_FORMAT.match(key)
        project, issue_id = match.group(1), match.group(2)
        return u"{}/{}/issues/{}".format(self.model.metadata["base_url"], project, issue_id)

    def get_persisted_default_config_fields(self):
        return ["project"]

    def get_projects_and_default(self, group, **kwargs):
        params = kwargs.get("params", {})
        defaults = self.get_project_defaults(group.project_id)
        kwargs["repo"] = params.get("project", defaults.get("project"))

        # In GitLab Repositories are called Projects
        default_project, project_choices = self.get_repository_choices(group, **kwargs)
        return default_project, project_choices

    def create_default_repo_choice(self, default_repo):
        client = self.get_client()
        try:
            # default_repo should be the project_id
            project = client.get_project(default_repo)
        except (ApiError, ApiUnauthorized):
            return ("", "")
        return (project["id"], project["name_with_namespace"])

    def get_create_issue_config(self, group, **kwargs):
        default_project, project_choices = self.get_projects_and_default(group, **kwargs)
        kwargs["link_referrer"] = "gitlab_integration"
        fields = super(GitlabIssueBasic, self).get_create_issue_config(group, **kwargs)

        org = group.organization
        autocomplete_url = reverse(
            "sentry-extensions-gitlab-search", args=[org.slug, self.model.id]
        )

        return [
            {
                "name": "project",
                "label": "GitLab Project",
                "type": "select",
                "url": autocomplete_url,
                "choices": project_choices,
                "defaultValue": default_project,
                "required": True,
            }
        ] + fields

    def create_issue(self, data, **kwargs):
        client = self.get_client()

        project_id = data.get("project")

        if not project_id:
            raise IntegrationError("project kwarg must be provided")

        try:
            issue = client.create_issue(
                project=project_id,
                data={"title": data["title"], "description": data["description"]},
            )
            project = client.get_project(project_id)
        except ApiError as e:
            raise IntegrationError(self.message_from_error(e))

        project_and_issue_iid = "%s#%s" % (project["path_with_namespace"], issue["iid"])
        return {
            "key": project_and_issue_iid,
            "title": issue["title"],
            "description": issue["description"],
            "url": issue["web_url"],
            "project": project_id,
            "metadata": {"display_name": project_and_issue_iid},
        }

    def after_link_issue(self, external_issue, **kwargs):
        data = kwargs["data"]
        project_id, issue_id = data.get("externalIssue", "").split("#")
        if not (project_id and issue_id):
            raise IntegrationError("Project and Issue id must be provided")

        client = self.get_client()
        comment = data.get("comment")
        if not comment:
            return

        try:
            client.create_issue_comment(
                project_id=project_id, issue_id=issue_id, data={"body": comment}
            )
        except ApiError as e:
            raise IntegrationError(self.message_from_error(e))

    def get_link_issue_config(self, group, **kwargs):
        default_project, project_choices = self.get_projects_and_default(group, **kwargs)

        org = group.organization
        autocomplete_url = reverse(
            "sentry-extensions-gitlab-search", args=[org.slug, self.model.id]
        )

        return [
            {
                "name": "project",
                "label": "GitLab Project",
                "type": "select",
                "default": default_project,
                "choices": project_choices,
                "url": autocomplete_url,
                "updatesForm": True,
                "required": True,
            },
            {
                "name": "externalIssue",
                "label": "Issue",
                "default": "",
                "type": "select",
                "url": autocomplete_url,
                "required": True,
            },
            {
                "name": "comment",
                "label": "Comment",
                "default": u"Sentry issue: [{issue_id}]({url})".format(
                    url=absolute_uri(
                        group.get_absolute_url(params={"referrer": "gitlab_integration"})
                    ),
                    issue_id=group.qualified_short_id,
                ),
                "type": "textarea",
                "required": False,
                "help": ("Leave blank if you don't want to " "add a comment to the GitLab issue."),
            },
        ]

    def get_issue(self, issue_id, **kwargs):
        project_id, issue_num = issue_id.split("#")
        client = self.get_client()

        if not project_id:
            raise IntegrationError("project must be provided")

        if not issue_num:
            raise IntegrationError("issue must be provided")

        try:
            issue = client.get_issue(project_id, issue_num)
            project = client.get_project(project_id)
        except ApiError as e:
            raise IntegrationError(self.message_from_error(e))

        project_and_issue_iid = "%s#%s" % (project["path_with_namespace"], issue["iid"])
        return {
            "key": project_and_issue_iid,
            "title": issue["title"],
            "description": issue["description"],
            "url": issue["web_url"],
            "project": project_id,
            "metadata": {"display_name": project_and_issue_iid},
        }

    def get_issue_display_name(self, external_issue):
        return external_issue.metadata["display_name"]
