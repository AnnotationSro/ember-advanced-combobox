module.exports = {
  normalizeEntityName: function() {},

  afterInstall: function() {
    return this.addPackagesToProject([
      { name: 'element-resize-detector', target: '^1.1.12' },
      { name: 'popper.js', target: '^1.9.9' },
      { name: 'ember-truth-helpers', target: '2.1.0'}
    ]);

  }
};
