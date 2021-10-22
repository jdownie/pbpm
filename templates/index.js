var pbpmApp = new Vue(
{ el: '#pbpm'
, delimiters: ['[[',']]']
, data() {
    return {
      'tab': null,
      'form': null,
      'landscape': null,
      'tabs': { 'welcome': 'Welcome'
              , 'stations': 'Stations'
              , 'services': 'Services'
              , 'owners': 'Owners'
              , 'maps': 'Maps'
              }
    }
  }
, mounted() {
    this.selectTab('maps');
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
      if (item == 'station') {
        this.landscape.station[this.form.station_code] = { 'name': this.form.name };
      } else if (item == 'service') {
        this.landscape.service[this.form.service_code] = { 'url_template': this.form.url_template };
      } else if (item == 'owner') {
        this.landscape.owner[this.form.owner_code] = { 'name': this.form.name };
      } else if (item == 'map') {
        this.landscape.map[this.form.map_code] = { 'name': this.form.name };
      }
      this.save();
      this.resetForm();
    },
    editItemBegin(item, code) {
      if (item == 'station') {
        this.form.edit_station_code = code;
      } else if (item == 'service') {
        this.form.edit_service_code = code;
      } else if (item == 'owner') {
        this.form.edit_owner_code = code;
      } else if (item == 'map') {
        this.form.edit_map_code = code;
      }
      this.vueRender();
    },
    editItemEnd(item) {
      if (item == 'station') {
        delete this.form.edit_station_code;
      } else if (item == 'service') {
        delete this.form.edit_service_code;
      } else if (item == 'owner') {
        delete this.form.edit_owner_code;
      } else if (item == 'map') {
        delete this.form.edit_map_code;
      }
      this.vueRender();
      this.save();
    },
    delItem: function(item, code) {
      if (item == 'station') {
        delete this.landscape.station[code];
      } else if (item == 'service') {
        delete this.landscape.service[code];
      } else if (item == 'owner') {
        delete this.landscape.owner[code];
      } else if (item == 'map') {
        delete this.landscape.map[code];
      }
      this.vueRender();
      this.save();
    },
    resetForm: function() {
      if (this.tab == 'stations') {
        this.form = { 'station_code': '', 'name': '' }
      } else if (this.tab == 'services') {
        this.form = { 'service_code': '', 'url_template': '' }
      } else if (this.tab == 'owners') {
        this.form = { 'owner_code': '', 'name': '' }
      } else if (this.tab == 'maps') {
        this.form = { 'map_code': '', 'name': '' }
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