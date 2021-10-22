var pbpmApp = new Vue(
{ el: '#pbpm'
, delimiters: ['[[',']]']
, data() {
    return {
      'tab': null,
      'form': null,
      'landscape': null,
      'tabs': { 'welcome': 'Welcome'
              , 'station': 'Stations'
              , 'service': 'Services'
              , 'owner': 'Owners'
              , 'map': 'Maps'
              },
      'cfg': { 'field_map':
               { 'station': { 'form_key': 'station_code', 'form_fields': [ 'name' ] }
               , 'service': { 'form_key': 'service_code', 'form_fields': [ 'url_template' ] }
               , 'owner': { 'form_key': 'owner_code', 'form_fields': [ 'name' ] }
               , 'map': { 'form_key': 'map_code', 'form_fields': [ 'name' ] }
               }
             }
    }
  }
, mounted() {
    this.selectTab('map');
    this.load();
    $('#pbpm').fadeIn();
  }
, methods: {
    vueRender: function() {
      this.form      = JSON.parse(JSON.stringify(this.form));
      this.landscape = JSON.parse(JSON.stringify(this.landscape));
    },
    save: function() {
      jQuery.post('/landscape/put/', JSON.stringify(this.landscape), null, 'text');
    },
    load: function() {
      jQuery.get('/landscape/get/', {}, function(data) { pbpmApp.landscape = data; }, 'json');
    },
    addItem: function(item) {
      var map = this.cfg.field_map;
      if (map[item] != undefined) {
        var record = {};
        var form_fields = map[item].form_fields;
        for (var f in form_fields) {
          var form_field = form_fields[f];
          record[form_field] = this.form[form_field];
        }
        var form_key = map[item].form_key;
        this.landscape[item][this.form[form_key]] = record;
      }
      this.save();
      this.resetForm();
    },
    editItemBegin(item, code) {
      this.form['edit_' + item + '_code'] = code;
      this.vueRender();
    },
    editItemEnd(item) {
      delete this.form['edit_' + item + '_code'];
      this.vueRender();
      this.save();
    },
    delItem: function(item, code) {
      delete this.landscape[item][code];
      this.vueRender();
      this.save();
    },
    resetForm: function() {
      var map = this.cfg.field_map;
      if (map[this.tab] != undefined) {
        var record = {};
        record[this.tab + '_code'] = '';
        var form_fields = map[this.tab].form_fields;
        for (var f in form_fields) {
          var form_field = form_fields[f];
          record[form_field] = '';
        }
        console.log(record);
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