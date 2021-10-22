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
    addStation: function() {
      this.landscape.station[this.form.station_code] = { 'name': this.form.name };
      this.save();
      this.resetForm();
    },
    editStationBegin: function(station_code) {
      this.form.edit_station_code = station_code;
      this.vueRender();
    },
    editStationEnd: function() {
      delete this.form.edit_station_code;
      this.vueRender();
      this.save();
    },
    delStation: function(station_code) {
      if (this.landscape.station[station_code] != undefined) {
        delete this.landscape.station[station_code];
        this.vueRender();
        this.save();
      }
    },
    addService: function() {
      this.landscape.service[this.form.service_code] = { 'url_template': this.form.url_template };
      this.save();
      this.resetForm();
    },
    editServiceBegin: function(service_code) {
      this.form.edit_service_code = service_code;
      this.vueRender();
    },
    editServiceEnd: function() {
      delete this.form.edit_service_code;
      this.vueRender();
      this.save();
    },
    delService: function(service_code) {
      if (this.landscape.service[service_code] != undefined) {
        delete this.landscape.service[service_code];
        this.vueRender();
        this.save();
      }
    },
    addOwner: function() {
      this.landscape.owner[this.form.owner_code] = { 'name': this.form.name };
      this.save();
      this.resetForm();
    },
    editOwnerBegin: function(owner_code) {
      this.form.edit_owner_code = owner_code;
      this.vueRender();
    },
    editOwnerEnd: function() {
      delete this.form.edit_owner_code;
      this.vueRender();
      this.save();
    },
    delOwner: function(owner_code) {
      if (this.landscape.owner[owner_code] != undefined) {
        delete this.landscape.owner[owner_code];
        this.vueRender();
        this.save();
      }
    },
    addMap: function() {
      this.landscape.map[this.form.map_code] = { 'name': this.form.name };
      this.save();
      this.resetForm();
    },
    editMapBegin: function(map_code) {
      this.form.edit_map_code = map_code;
      this.vueRender();
    },
    editMapEnd: function() {
      delete this.form.edit_map_code;
      this.vueRender();
      this.save();
    },
    delMap: function(map_code) {
      if (this.landscape.map[map_code] != undefined) {
        delete this.landscape.map[map_code];
        this.vueRender();
        this.save();
      }
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