import { isPresent } from '@ember/utils';
import { assert } from '@ember/debug';
import { inject as service } from '@ember/service';
import Helper from '@ember/component/helper';

export default Helper.extend({
  configurationService: service('adv-combobox-configuration-service'),

  compute(params) {
    let [iconClassName, customIconClass] = params;
    if  (isPresent(customIconClass )) return customIconClass;

    let icon = this.get('configurationService').getIconStyles()[iconClassName];
    assert(`unknown icon name: ${iconClassName}`, isPresent(icon));

    return icon;
  }
});
