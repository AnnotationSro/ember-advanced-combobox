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
    return this.addAddonToProject(
          {name: 'ember-string-ishtmlsafe-polyfill', target: '^1.0.0'}
    );
  }
};
