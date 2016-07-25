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
      return this.addAddonsToProject({
        packages: [
          {name: 'ember-string-ishtmlsafe-polyfill', target: '^1.0.0'},
          {name: 'ember-cli-font-awesome', target: '^1.5.0'}
        ]
      });
  }
};
