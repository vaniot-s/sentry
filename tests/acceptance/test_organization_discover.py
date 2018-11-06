from __future__ import absolute_import

from sentry.testutils import AcceptanceTestCase


class OrganizationDiscoverTest(AcceptanceTestCase):
    def setUp(self):
        super(OrganizationDiscoverTest, self).setUp()
        self.user = self.create_user('foo@example.com')
        self.org = self.create_organization(owner=self.user, name='Rowdy Tiger')
        self.team = self.create_team(organization=self.org, name='Mariachi Band')
        self.project = self.create_project(
            organization=self.org,
            teams=[self.team],
            name='Bengal',
        )
        self.login_as(self.user)
        self.path = u'/organizations/{}/discover/'.format(self.org.slug)

    def test_no_access(self):
        self.browser.get(self.path)
        self.browser.wait_until_not('.loading')
        self.browser.snapshot('discover - no access')

    def test_query_builder(self):
        with self.feature('organizations:discover'):
            self.browser.get(self.path)
            self.browser.wait_until_not('.loading')
            self.browser.snapshot('discover - query builder')

    def test_run_query(self):
        with self.feature('organizations:discover'):
            self.browser.get(self.path)
            self.browser.wait_until_not('.loading')
            self.browser.find_element_by_xpath("//button[contains(text(), 'Run')]").click()
            self.browser.wait_until_not('.loading')
            self.browser.snapshot('discover - query results')

    def test_save_query(self):
        with self.feature('organizations:discover'):
            self.browser.get(self.path)
            self.browser.wait_until_not('.loading')
            self.browser.find_element_by_xpath("//button[contains(text(), 'Save')]").click()
            self.browser.wait_until_not('.loading')
            self.browser.snapshot('discover - saved query')

    def test_saved_query_list(self):
        with self.feature('organizations:discover'):
            self.browser.get(self.path)
            self.browser.wait_until_not('.loading')
            self.browser.find_element_by_xpath("//button[contains(text(), 'Save')]").click()
            self.browser.get(self.path + '?view=saved')
            self.browser.wait_until_not('.loading')
            self.browser.snapshot('discover - saved query list')
