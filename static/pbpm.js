var pbpm =
{ loading: 2,
  landscape: {},
  activeInstances: {},
  cfg: {},
  load: function(cb) {
    var instance = this;
    jQuery.get( '../cfg/table.json',
                {},
                function(data) {
                  instance.cfg.table = data;
                  instance.loading--;
                  jQuery.get( '../landscape/get/',
                              {},
                              function(data) {
                                instance.landscape = data;
                                instance.loading--;
                                if (cb != undefined) {
                                  cb(instance);
                                }
                              },
                              'json'
                            );
                },
                'json'
              );
  },
  save: function(cb) {
    var instance = this;
    jQuery.post( '../landscape/put/',
                 JSON.stringify(instance.landscape),
                 function(data) {
                   instance.landscape = data;
                 },
                 'json'
               );
  },
  instances: {
    active: {
      load: function() {
        var instance = this;
        jQuery.get( '../instances/active/',
                    {},
                    function(data) {
                      pbpm.activeInstances = data;
                    },
                    'json'
                  );
      }
    }
  },
  table: {
    add: function(item, record) {
      var code = record.code;
      delete record.code;
      pbpm.landscape[item][code] = record;
      pbpm.save();
    },
    del: function(item, code) {
      delete pbpm.landscape[item][code];
    }
  },
  service: {
    add: function(record) {
      //pbpm.landscape.station.push(record);
      pbpm.save();
    }
  },
};
