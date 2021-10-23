var pbpmApp = new Vue(
{ el: '#pbpm'
, delimiters: ['[[',']]']
, data() {
    return {
      'tab': null,
      'form': null,
      'landscape': null,
      'cfg': { 'table':
               { 'station': { 'label': 'Stations', 'fields': { 'name': 'Name' } }
               , 'service': { 'label': 'Services', 'fields': { 'url_template': 'URL Template' } }
               , 'owner': { 'label': 'Owners', 'fields': { 'name': 'Name' } }
               , 'map': { 'label': 'Maps', 'fields': { 'name': 'Name' } }
               }
             , 'debug': false
             }
    }
  }
, mounted() {
    this.load();
    $('#pbpm').fadeIn();
    window.addEventListener("dblclick", function(event) { pbpmApp.cfg.debug = ! pbpmApp.cfg.debug; }, false);
    this.selectTab('map');
    /*
    window.setTimeout(function() {
      pbpmApp.editMap('AUC');
    }, 500);
    */
  }
, filters: {
  configStepLabel: function(landscape, record, map_code, i) {
    var type = record.type.toUpperCase();
    var ret = ( i + 1 ) + ') ' + type + ':' + record.code;
    var label = '';
    if (type == 'STATION') {
      if ( landscape.station[record.code] != undefined) {
        label = ' - ' + landscape.station[record.code].name;
      }
    }
    ret = ret + label;
    return ret;
  }
}
, methods: {
    drawMapNode: function() {
      var w = $('#diagram').width();
      $('#diagram').html('<canvas id="diagramCanvas"></canvas>');
      $('#diagramCanvas').css('width', w + 'px').css('height', w / 2 + 'px');
      const canvas = document.getElementById('diagramCanvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'green';
      ctx.fillRect(10, 10, 10, 10);
    },
    mapAddStation(e) {
      if (this.form.add.station_code != '') {
        var record = { 'type': 'station', 'code': this.form.add.station_code };
        var srcActions = this.landscape.station[this.form.add.station_code].actions;
        var dstActions = new Array();
        for (var a in srcActions) {
          var newAction = { 'code': srcActions[a].code, 'leads_to': null };
          dstActions.push(newAction);
        }
        record.actions = dstActions;
        this.landscape.map[this.form.code].config.push(record);
        this.form.add.station_code = '';
        this.save();
      }
    },
    mapAddService(e) {
      if (this.form.add.service_code != '') {
        var record = { 'type': 'service', 'code': this.form.add.service_code };
        this.landscape.map[this.form.code].config.push(record);
        this.form.add.service_code = '';
        this.save();
      }
    },
    mapSelect(config_id, action_id = undefined) {
      // First, check to see if we're selecting a station or not...
      var type = this.landscape.map[this.form.code].config[config_id].type;
      var code = this.landscape.map[this.form.code].config[config_id].code;
      console.log(config_id, type, code, action_id );
      if (type == 'station' && action_id != undefined) {
        console.log('Handling as a station and action selection.');
        if (this.form.edit != null && this.form.edit.length == 2 && this.form.edit[0] == config_id && this.form.edit[1] == action_id) {
          this.form.edit = null;
          this.form.leads_to = '';
        } else {
          this.form.edit = [ config_id, action_id ];
          var station_code = this.landscape.map[this.form.code].config[config_id].code;
          var action = this.landscape.map[this.form.code].config[config_id].actions[action_id];
          if (action.leads_to != undefined && action.leads_to != null) {
            this.form.leads_to = action.leads_to;
          } else {
            this.form.leads_to = '';
          }
        }
      } else if (type == 'station' && code == 'BEGIN' || type == 'service') {
        console.log('Handling as a service or BEGIN selection.')
        if (this.form.edit != null && this.form.edit[0] == config_id) {
          this.form.edit = null;
          this.form.leads_to = '';
        } else {
          this.form.edit = [ config_id ];
          if (this.landscape.map[this.form.code].config[this.form.edit[0]].leads_to != undefined) {
            this.form.leads_to = this.landscape.map[this.form.code].config[this.form.edit[0]].leads_to;
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
      this.landscape = JSON.parse(JSON.stringify(this.landscape));
    },
    save: function() {
      jQuery.post('/landscape/put/', JSON.stringify(this.landscape), function(data) { pbpmApp.landscape = data; }, 'json');
    },
    load: function() {
      jQuery.get('/landscape/get/', {}, function(data) { pbpmApp.landscape = data; }, 'json');
    },
    addItem: function(item) {
      var map = this.cfg.table;
      if (map[item] != undefined) {
        var record = {};
        var fields = map[item].fields;
        for (var field in fields) {
          record[field] = this.form[field];
        }
        this.landscape[item][this.form['code']] = record;
      }
      this.save();
      this.resetForm();
    },
    editItemBegin(item, code) {
      this.form['edit_code'] = code;
      this.vueRender();
    },
    editItemEnd(item) {
      delete this.form.edit_code;
      this.vueRender();
      this.save();
    },
    delItem: function(item, code) {
      delete this.landscape[item][code];
      this.vueRender();
      this.save();
    },
    linkMap: function() {
      var src = this.form.edit;
      var dst = this.form.leads_to;
      var node = this.landscape.map[this.form.code].config[src[0]]
      if (src.length == 2) {
        node = node.actions[src[1]];
      }
      node.leads_to = dst;
      this.save();
    },
    editStation: function(code) {
      if (this.landscape.station[code] != undefined) {
        if (this.landscape.station[code].actions == undefined) {
          this.landscape.station[code].actions = [];
        }
        this.selectTab('editStation');
        this.form = { 'code': code, 'add': { 'action_code': '', 'label': '', 'color': '#198754' }, 'edit': null }
      }
    },
    addStationAction() {
      var record = JSON.parse(JSON.stringify(this.form.add));
      this.landscape.station[this.form.code].actions.push(record);
      this.editStation(this.form.code);
      this.save();
    },
    delStationAction(i) {
      this.landscape.station[this.form.code].actions.pop(i);
      this.save();
    },
    editMap: function(code) {
      this.selectTab('editMap');
      this.form = { 'code': code, 'add': { 'station_code': '' }, 'edit': null, 'leads_to': '' };
    },
    resetForm: function() {
      var map = this.cfg.table;
      if (map[this.tab] != undefined) {
        var record = {};
        record['code'] = '';
        var fields = map[this.tab].fields;
        for (var field in fields) {
          record[field] = '';
        }
        this.form = record;
        this.vueRender();
      } else {
        this.form = null;
      }
    },
    selectTab: function(tab) {
      this.tab = tab;
      this.resetForm();
    }
  }
});