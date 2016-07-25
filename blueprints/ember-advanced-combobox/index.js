/*jshint node:true*/
module.exports = {
  description: '',

  // locals: function(options) {
  //   // Return custom template variables here.
  //   return {
  //     foo: options.entity.options.foo
  //   };
  // }

  normalizeEntityName: function () {
  },

  afterInstall: function () {

    var that = this;
        return this.addAddonToProject({name: 'ember-string-ishtmlsafe-polyfill', target: '^1.0.0'})
        .then(function(){
          return that.addBowerPackagesToProject([
            {name: "ember-font-awesome", target: "~2.1.0"}
          ]);
        });
  }
};
