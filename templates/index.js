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
              , 'maps': 'Maps'
              }
    }
  }
, mounted() {
    this.selectTab('services');
    this.load();
    $('#pbpm').fadeIn();
  }
, methods: {
    vueRender: function() {
      this.form      = JSON.parse(JSON.stringify(this.form));
      this.landscape = JSON.parse(JSON.stringify(this.landscape));
    },
    save: function() {
      jQuery.post('/landscape/put/', JSON.stringify(this.landscape), function(data) { console.log(data); }, 'text');
    },
    load: function() {
      jQuery.get('/landscape/get/', {}, function(data) { pbpmApp.landscape = data; }, 'json');
    },
    addStation: function() {
      this.landscape.station[this.form.station_code] = this.form.station_desc;
      this.save();
      this.resetForm();
    },
    editStationBegin: function(station_code) {
      console.log('begin', station_code);
      this.form.edit_station_code = station_code;
      this.vueRender();
    },
    editStationEnd: function() {
      console.log('end');
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
    delService: function(service_code) {
      if (this.landscape.service[service_code] != undefined) {
        delete this.landscape.service[service_code];
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
      console.log('begin', service_code);
      this.form.edit_service_code = service_code;
      this.vueRender();
    },
    editServiceEnd: function() {
      console.log('end');
      delete this.form.edit_service_code;
      this.vueRender();
      this.save();
    },
    resetForm: function() {
      if (this.tab == 'stations') {
        this.form = { 'station_code': '', 'station_desc': '' }
      } else if (this.tab == 'services') {
        this.form = { 'service_code': '', 'url_template': '' }
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