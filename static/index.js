var pbpmApp = new Vue(
{ el: '#pbpm',
  delimiters: ['[[',']]'],
  data: function() {
    return {
      'tab': null,
      'form': null,
      'svc': null,
      'cfg': { 'debug': false
             }
    };
  },
  mounted: function() {
    pbpm.load(function() {
      pbpmApp.svc = pbpm;
      pbpmApp.selectTab('instances');
      $('#pbpm').fadeIn();
    });
    window.addEventListener("dblclick", function(event) { pbpmApp.cfg.debug = ! pbpmApp.cfg.debug; }, false);
  },
  filters: {
    displayName: function(code, type) {
      ret = '';
      if (Object.keys(pbpmApp.svc.landscape[type]).indexOf(code) != -1) {
        cols = [ 'name', 'url_template' ];
        var col = null;
        for (var i in cols) {
          if (col == null && Object.keys(pbpmApp.svc.landscape[type][code]).indexOf(cols[i]) != -1) {
            col = cols[i];
          }
        }
        ret = ( col == null ? code : pbpmApp.svc.landscape[type][code][col] );
      }
      return ret;
    },
    datetimeFormat: function(utc) {
      var ret = moment(utc).format('D MMM, H:mm:sa');
      return ret;
    },
    configStepLabel: function(landscape, record, map_code, i) {
      var type = record.type.toUpperCase();
      var ret = ( i + 1 ) + '. ' + record.code;
      var label = '';
      if (type == 'STATION') {
        if ( landscape.station[record.code] != undefined) {
          label = ' - ' + landscape.station[record.code].name;
        }
      }
      ret = ret + label + ' (' + type + ')';
      return ret;
    }
  },
  methods: {
    drawMapNode: function() {
      var w = $('#diagram').width();
      $('#diagram').html('<canvas id="diagramCanvas"></canvas>');
      $('#diagramCanvas').css('width', w + 'px').css('height', w / 2 + 'px');
      var canvas = document.getElementById('diagramCanvas');
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = 'green';
      ctx.fillRect(10, 10, 10, 10);
    },
    mapAddStation: function(e) {
      if (this.form.add.station_code != '') {
        var record = { 'type': 'station', 'code': this.form.add.station_code };
        var srcActions = this.svc.landscape.station[this.form.add.station_code].actions;
        var dstActions = [];
        for (var a in srcActions) {
          var newAction = { 'code': srcActions[a].code, 'leads_to': null };
          dstActions.push(newAction);
        }
        record.actions = dstActions;
        this.svc.landscape.map[this.form.code].config.push(record);
        this.form.add.station_code = '';
        this.form.renderTrigger++;
        this.svc.save();
      }
    },
    mapAddService: function(e) {
      if (this.form.add.service_code != '') {
        var record = { 'type': 'service', 'code': this.form.add.service_code };
        this.svc.landscape.map[this.form.code].config.push(record);
        this.form.add.service_code = '';
        this.form.renderTrigger++;
        this.svc.save();
      }
    },
    mapAddRouter: function(e) {
      if (this.form.add.router_code != '') {
        var record = { 'type': 'router', 'code': this.form.add.router_code };
        var srcActions = this.svc.landscape.router[this.form.add.router_code].actions;
        var dstActions = [];
        for (var a in srcActions) {
          var newAction = { 'code': srcActions[a].action_code, 'leads_to': null };
          dstActions.push(newAction);
        }
        record.actions = dstActions;
        this.svc.landscape.map[this.form.code].config.push(record);
        this.form.add.router_code = '';
        this.form.renderTrigger++;
        this.svc.save();
      }
    },
    mapSelect: function(config_id, action_id) {
      // First, check to see if we're selecting a station or not...
      var type = this.svc.landscape.map[this.form.code].config[config_id].type;
      var code = this.svc.landscape.map[this.form.code].config[config_id].code;
      console.log(config_id, type, code, action_id );
      if ([ 'station', 'router' ].indexOf(type) != -1 && action_id != undefined) {
        console.log('Handling as a station/router and action selection.');
        if (this.form.edit != null && this.form.edit.length == 2 && this.form.edit[0] == config_id && this.form.edit[1] == action_id) {
          this.form.edit = null;
          this.form.leads_to = '';
        } else {
          this.form.edit = [ config_id, action_id ];
          var action = this.svc.landscape.map[this.form.code].config[config_id].actions[action_id];
          if (action.leads_to != undefined && action.leads_to != null) {
            this.form.leads_to = action.leads_to;
          } else {
            this.form.leads_to = '';
          }
        }
      } else if (type == 'station' && code == 'BEGIN' || type == 'service') {
        console.log('Handling as a service or BEGIN selection.');
        if (this.form.edit != null && this.form.edit[0] == config_id) {
          this.form.edit = null;
          this.form.leads_to = '';
        } else {
          this.form.edit = [ config_id ];
          if (this.svc.landscape.map[this.form.code].config[this.form.edit[0]].leads_to != undefined) {
            this.form.leads_to = this.svc.landscape.map[this.form.code].config[this.form.edit[0]].leads_to;
          } else {
            this.form.leads_to = '';
          }
        }
      } else {
        // This shouldn't get hit anymore; i'm using a click.stop on the descendant now.
        console.log('This must have been propegated from a descendant.');
      }
      /*
      this.drawMapNode();
      */
    },
    vueRender: function() {
      this.form      = JSON.parse(JSON.stringify(this.form));
      //this.svc.landscape = JSON.parse(JSON.stringify(this.svc.landscape));
    },
    tableAdd: function(item) {
      // Add a record to one of the reference tables.
      var map = this.svc.cfg.table;
      if (map[item] != undefined) {
        var record = { 'code': this.form.code };
        var fields = map[item].fields;
        for (var field in fields) {
          record[field] = this.form[field];
        }
        this.svc.table.add(item, record);
      }
      this.svc.save();
      this.resetForm();
    },
    tableDel: function(item, code) {
      this.svc.table.del(item, code);
      this.vueRender();
      this.svc.save();
    },
    editItemBegin: function(item, code) {
      // Prepare a record for editing.
      this.form.edit_code = code;
      this.vueRender();
    },
    editItemEnd: function(item) {
      // Complete the editing of a record and trigger a save.
      delete this.form.edit_code;
      this.vueRender();
      this.svc.save();
    },
    linkMap: function() {
      var src = this.form.edit;
      var dst = this.form.leads_to;
      var node = this.svc.landscape.map[this.form.code].config[src[0]];
      if (src.length == 2) {
        node = node.actions[src[1]];
      }
      node.leads_to = dst;
      this.form.renderTrigger++;
      this.svc.save();
    },
    editStation: function(code) {
      if (this.svc.landscape.station[code] != undefined) {
        if (this.svc.landscape.station[code].actions == undefined) {
          this.svc.landscape.station[code].actions = [];
        }
        this.selectTab('editStation');
        this.form = { 'code': code, 'add': { 'action_code': '', 'label': '', 'color': '#198754' }, 'edit': null };
      }
    },
    editRouter: function(code) {
      if (this.svc.landscape.router[code] != undefined) {
        if (this.svc.landscape.router[code].actions == undefined) {
          this.svc.landscape.station[code].actions = [];
        }
        this.selectTab('editRouter');
        this.form = { 'code': code, 'add': { 'action_code': '', 'label': '', 'expression': '' }, 'edit': null };
      }
    },
    addStationAction: function() {
      var record = JSON.parse(JSON.stringify(this.form.add));
      this.svc.landscape.station[this.form.code].actions.push(record);
      this.editStation(this.form.code);
      this.svc.save();
    },
    addRouterAction: function() {
      var record = JSON.parse(JSON.stringify(this.form.add));
      this.svc.landscape.router[this.form.code].actions.push(record);
      this.editRouter(this.form.code);
      this.svc.save();
    },
    delStationAction: function(i) {
      console.log('dsa', i);
      this.svc.landscape.station[this.form.code].actions.splice(i, 1);
      this.svc.save();
    },
    delRouterAction: function(i) {
      console.log('dra', i);
      this.svc.landscape.router[this.form.code].actions.splice(i, 1);
      this.svc.save();
    },
    editMap: function(code) {
      this.selectTab('editMap');
      this.form = { 'code': code, 'add': { 'station_code': '', 'service_code': '', 'router_code': '' }, 'edit': null, 'leads_to': '', 'renderTrigger': 0 };
    },
    resetForm: function() {
      var map = this.svc.cfg.table;
      if (map[this.tab] != undefined) {
        var record = {};
        record.code = '';
        var fields = map[this.tab].fields;
        for (var field in fields) {
          record[field] = '';
        }
        this.form = record;
        this.vueRender();
      } else if (this.tab == 'create') {
        var vars = [];
        vars.push({ 'var': 'intVar', 'val': -7 });
        vars.push({ 'var': 'charVar', 'val': 'AAA' });
        vars.push({ 'var': 'floatVar', 'val': 7.3 });
        this.form = { 'vars': vars, 'map_code': 'ND', 'owner_code': 'ringo.starr' };
      } else if (this.tab == 'instances') {
        this.form = { 'id': null, 'instance': null, 'bookmark': '', 'owner_code': 'john.doe' };
        this.svc.instances.active.load();
      } else if (this.tab == 'graphviz') {
        this.form = { 'code': Object.keys(this.svc.landscape.map)[0] };
      } else {
        this.form = null;
      }
    },
    selectTab: function(tab) {
      this.tab = tab;
      this.resetForm();
    },
    resurrectInstance: function(e) {
      var url = '/instance/resurrect/' + this.form.id + '/' + this.form.bookmark + '/' + 'james.downie';
      jQuery.get(url, {}, function(data) {
        this.selectTab('instances');
      });
    },
    delMapConfigItem: function(i) {
      // First, make sure that nothing leads to this index...
      var config = this.svc.landscape.map[this.form.code].config;
      for (var j in config) {
        var item = config[j];
        if (Object.keys(item).indexOf('actions') != -1) {
          for (var k in item.actions) {
            var action = item.actions[k];
            if (action.leads_to == i) {
              action.leads_to = null;
            }
          }
        }
        if (Object.keys(item).indexOf('leads_to') != -1) {
          if (item.leads_to == i) {
            item.leads_to = null;
          }
        }
      }
      this.svc.landscape.map[this.form.code].config.splice(i, 1);
      this.form.renderTrigger++;
      this.svc.save();
    },
    createSubmit: function(e) {
      var vars = {}
      for (var i in this.form.vars) {
        vars[this.form.vars[i].var] = this.form.vars[i].val;
      }
      jQuery.post('/instance/create/', { 'map_code': this.form.map_code, 'owner_code': this.form.owner_code, 'vars': JSON.stringify(vars) }, function(data) {
        console.log(data);
      });
    },
    loadInstance: function(id) {
      var app = this;
      jQuery.get('/instance/' + id, {}, function(data) {
        app.form.instance = data;
      });
    },
    progressInstance: function(action_code = null, owner_code = null) {
      var url = '/instance/progress/' + this.form.id;
      if (action_code != null && owner_code != null) {
        url = url + '/' + action_code + '/' + owner_code;
      }
      jQuery.get(url, {}, function(data) {
        console.log(data);
        pbpmApp.loadInstance(pbpmApp.form.id);
      });
    }
  }
});