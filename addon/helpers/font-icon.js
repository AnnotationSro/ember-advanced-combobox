import Ember from 'ember';

export default Ember.Helper.extend({
  configurationService: Ember.inject.service('adv-combobox-configuration-service'),

  compute(params) {
    let [iconClassName] = params;
    let icon = this.get('configurationService').getIconStyles()[iconClassName];
    Ember.assert(`unknown icon name: ${iconClassName}`, Ember.isPresent(icon));

    return icon;
  }
});
