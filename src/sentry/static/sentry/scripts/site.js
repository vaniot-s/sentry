// Generated by CoffeeScript 1.3.3
(function() {
  var app,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.app = app = app || {};

  app.config = app.config || {};

  jQuery(function() {
    var StreamView;
    return app.StreamView = StreamView = (function(_super) {

      __extends(StreamView, _super);

      function StreamView() {
        return StreamView.__super__.constructor.apply(this, arguments);
      }

      StreamView.prototype.el = $('body');

      StreamView.prototype.initialize = function(data) {
        var group_list;
        return group_list = new app.GroupListView({
          id: 'event_list',
          members: data.groups
        });
      };

      return StreamView;

    })(Backbone.View);
  });

  Backbone.sync = function(method, model, success, error) {
    return success();
  };

  window.app = app = app || {};

  jQuery(function() {
    var ScoredList;
    return app.ScoredList = ScoredList = (function(_super) {

      __extends(ScoredList, _super);

      function ScoredList() {
        return ScoredList.__super__.constructor.apply(this, arguments);
      }

      ScoredList.prototype.initialize = function() {
        var model;
        _.bindAll(this);
        return model = app.Group;
      };

      ScoredList.prototype.comparator = function(member) {
        return -member.get('score');
      };

      return ScoredList;

    })(Backbone.Collection);
  });

  window.app = app = app || {};

  jQuery(function() {
    var Group, Project, User;
    app.User = User = (function(_super) {

      __extends(User, _super);

      function User() {
        return User.__super__.constructor.apply(this, arguments);
      }

      User.prototype.defaults = {
        name: null,
        avatar: null
      };

      User.prototype.isAnonymous = function() {
        return !(this.id != null);
      };

      User.prototype.isUser = function(user) {
        return this.id === user.id;
      };

      return User;

    })(Backbone.Model);
    app.Project = Project = (function(_super) {

      __extends(Project, _super);

      function Project() {
        return Project.__super__.constructor.apply(this, arguments);
      }

      Project.prototype.defaults = {
        name: null,
        slug: null
      };

      return Project;

    })(Backbone.Model);
    return app.Group = Group = (function(_super) {

      __extends(Group, _super);

      function Group() {
        return Group.__super__.constructor.apply(this, arguments);
      }

      Group.prototype.defaults = {
        tags: [],
        versions: [],
        isBookmarked: false,
        historicalData: []
      };

      return Group;

    })(Backbone.Model);
  });

  window.app = app = app || {};

  app.utils = app.utils || {};

  jQuery(function() {
    app.utils.getQueryParams = function() {
      var chunk, hash, hashes, href, vars, _i, _len;
      vars = {};
      href = window.location.href;
      if (href.indexOf('?') === -1) {
        return vars;
      }
      hashes = href.slice(href.indexOf('?') + 1, (href.indexOf('#') !== -1 ? href.indexOf('#') : href.length)).split('&');
      for (_i = 0, _len = hashes.length; _i < _len; _i++) {
        chunk = hashes[_i];
        hash = chunk.split('=');
        if (!hash[0] && !hash[1]) {
          return;
        }
        vars[hash[0]] = hash[1] ? decodeURIComponent(hash[1]).replace(/\+/, ' ') : '';
      }
      return vars;
    };
    return Date(function() {
      var numericKeys, origParse;
      origParse = Date.parse;
      numericKeys = [1, 4, 5, 6, 7, 10, 11];
      return Date.parse = function(date) {
        var k, minutesOffset, struct, timestamp, _i, _len;
        struct = {};
        minutesOffset = 0;
        if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
          for (_i = 0, _len = numericKeys.length; _i < _len; _i++) {
            k = numericKeys[_i];
            struct[k] = +struct[k] || 0;
          }
          struct[2] = (+struct[2] || 1) - 1;
          struct[3] = +struct[3] || 1;
          if (struct[8] !== 'Z' && struct[9]) {
            minutesOffset = struct[10] * 60 + struct[11];
            if (struct[9] === '+') {
              minutesOffset = 0 - minutesOffset;
            }
          }
          timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
        } else {
          timestamp = origParse ? origParse(date) : NaN;
        }
        return timestamp;
      };
    });
  });

  window.app = app = app || {};

  jQuery(function() {
    var GroupListView, GroupView, OrderedElementsView;
    app.OrderedElementsView = OrderedElementsView = (function(_super) {

      __extends(OrderedElementsView, _super);

      function OrderedElementsView() {
        return OrderedElementsView.__super__.constructor.apply(this, arguments);
      }

      OrderedElementsView.prototype.initialize = function(data) {
        _.bindAll(this);
        this.$parent = $('#' + this.id);
        this.queue = new app.ScoredList;
        this.collection = new app.ScoredList;
        this.collection.add(data.members || []);
        this.collection.on('add', this.renderMemberInContainer);
        this.collection.on('remove', this.unrenderMember);
        this.collection.on('reset', this.reSortMembers);
        this.collection.sort();
        this.realtimeEnabled = data.realtimeEnabled || true;
        this.poll();
        return window.setInterval(this.tick, 300);
      };

      OrderedElementsView.prototype.addMember = function(member) {
        if (!this.hasMember(member)) {
          return this.collection.add(member);
        } else {
          return this.updateMember(member);
        }
      };

      OrderedElementsView.prototype.reSortMembers = function() {
        var _this = this;
        return this.collection.each(function(member) {
          return _this.renderMemberInContainer(member);
        });
      };

      OrderedElementsView.prototype.updateMember = function(member) {
        var obj;
        obj = this.collection.get(member.id);
        obj.set('count', member.get('count'));
        obj.set('score', member.get('score'));
        return this.collection.sort();
      };

      OrderedElementsView.prototype.hasMember = function(member) {
        if (this.collection.get(member.id)) {
          return true;
        } else {
          return false;
        }
      };

      OrderedElementsView.prototype.removeMember = function(member) {
        return this.collection.remove(member);
      };

      OrderedElementsView.prototype.renderMemberInContainer = function(member) {
        var $el, $rel, new_pos;
        new_pos = this.collection.indexOf(member);
        $el = $('#' + this.id + member.id);
        if (!$el.length) {
          $el = this.renderMember(member);
        } else if ($el.index() === new_pos) {
          return;
        }
        if (new_pos === 0) {
          return this.$parent.prepend($el);
        } else {
          $rel = $('#' + this.id + this.collection.at(new_pos - 1));
          if (!$rel.length) {
            return this.$parent.append($el);
          } else {
            return this.$parent.insertBefore($rel);
          }
        }
      };

      OrderedElementsView.prototype.renderMember = function(member) {
        var out, view;
        view = new GroupView({
          model: member,
          id: this.id + member.id
        });
        out = view.render();
        return $(out.el);
      };

      OrderedElementsView.prototype.unrenderMember = function(member) {
        return $('#' + this.id + member.id).remove();
      };

      OrderedElementsView.prototype.tick = function() {
        if (!this.queue.length) {
          return;
        }
        $('#no_messages').remove();
        return this.addMember(this.queue.pop());
      };

      OrderedElementsView.prototype.getPollUrl = function() {
        return app.config.urlPrefix + '/api/' + app.config.projectId + '/poll/';
      };

      OrderedElementsView.prototype.poll = function() {
        var data, item, _results,
          _this = this;
        if (!this.realtimeEnabled) {
          window.setTimeout(this.poll, 1000);
        }
        data = app.utils.getQueryParams();
        data.view_id = app.config.viewId || void 0;
        data.cursor = this.cursor || void 0;
        $.ajax({
          url: this.getPollUrl(),
          type: 'get',
          dataType: 'json',
          data: data,
          success: function(groups) {
            var obj, _i, _len;
            if (!groups.length) {
              setTimeout(_this.poll, 5000);
              return;
            }
            _this.cursor = groups[groups.length - 1].score || void 0;
            for (_i = 0, _len = groups.length; _i < _len; _i++) {
              data = groups[_i];
              obj = _this.queue.get(data.id);
              if (obj) {
                obj.set('count', data.count);
                obj.set('score', data.score);
                _this.queue.sort();
              } else {
                _this.queue.add(data);
              }
            }
            return window.setTimeout(_this.poll, 1000);
          },
          error: function() {
            return window.setTimeout(_this.poll, 10000);
          }
        });
        _results = [];
        while (this.collection.length > 50) {
          _results.push(item = this.collection.pop());
        }
        return _results;
      };

      return OrderedElementsView;

    })(Backbone.View);
    app.GroupListView = GroupListView = (function(_super) {

      __extends(GroupListView, _super);

      function GroupListView() {
        return GroupListView.__super__.constructor.apply(this, arguments);
      }

      return GroupListView;

    })(OrderedElementsView);
    return app.GroupView = GroupView = (function(_super) {

      __extends(GroupView, _super);

      function GroupView() {
        return GroupView.__super__.constructor.apply(this, arguments);
      }

      GroupView.prototype.tagName = 'li';

      GroupView.prototype.className = 'group';

      GroupView.prototype.template = _.template($('#group-template').html());

      GroupView.prototype.initialize = function() {
        _.bindAll(this);
        return this.model.on("change:count", this.updateCount);
      };

      GroupView.prototype.render = function() {
        var data;
        data = this.model.toJSON();
        data.historicalData = this.getHistoricalAsString(this.model);
        this.$el.html(this.template(data));
        this.$el.addClass(this.getLevelClassName(this.model));
        if (data.isResolved) {
          this.$el.addClass('resolved');
        }
        if (data.historicalData) {
          this.$el.addClass('with-metadata');
        }
        this.$el.attr('data-id', data.id);
        return this;
      };

      GroupView.prototype.getHistoricalAsString = function(obj) {
        if (obj.get('historicalData')) {
          return obj.get('historicalData').join(', ');
        } else {
          return '';
        }
      };

      GroupView.prototype.getLevelClassName = function(obj) {
        return 'level-' + obj.get('levelName');
      };

      GroupView.prototype.updateCount = function(obj) {
        return $('.count span', this.$el).text(this.model.get("count"));
      };

      return GroupView;

    })(Backbone.View);
  });

}).call(this);
