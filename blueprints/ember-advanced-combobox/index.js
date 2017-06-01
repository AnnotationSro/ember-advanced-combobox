module.exports = {
  normalizeEntityName: function() {},

  afterInstall: function() {
    return this.addPackageToProject("popper.js", "^1.9.9");
  }
};
