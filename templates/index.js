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
      'cfg': { 'table':
               { 'station': { 'label': 'Stations', 'fields': { 'name': 'Name' } }
               , 'service': { 'label': 'Services', 'fields': { 'url_template': 'URL Template' } }
               , 'owner': { 'label': 'Owners', 'fields': { 'name': 'Name' } }
               , 'map': { 'label': 'Maps', 'fields': { 'name': 'Name' } }
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
    resetForm: function() {
      var map = this.cfg.table;
      if (map[this.tab] != undefined) {
        var record = {};
        record['code'] = '';
        var fields = map[this.tab].fields;
        for (var field in fields) {
          record[field] = '';
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