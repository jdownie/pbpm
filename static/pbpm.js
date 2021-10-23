var pbpm =
{ landscape: {},
  load: function(cb) {
    var instance = this;
    jQuery.get( '/landscape/get/',
                {},
                function(data) {
                  instance.landscape = data;
                  if (cb != undefined) {
                    cb(this);
                  }
                },
                'json'
              );
  }
};