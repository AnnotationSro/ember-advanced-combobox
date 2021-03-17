import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';
import { assert } from '@ember/debug';
import Helper from '@ember/component/helper';

@classic
export default class FontIcon extends Helper {
  @service('adv-combobox-configuration-service')
  configurationService;

  compute(params) {
    let [iconClassName, customIconClass] = params;
    if  (isPresent(customIconClass )) return customIconClass;

    let icon = this.get('configurationService').getIconStyles()[iconClassName];
    assert(`unknown icon name: ${iconClassName}`, isPresent(icon));

    return icon;
  }
}
