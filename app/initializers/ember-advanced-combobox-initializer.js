import env from '../config/environment';
import configuration from 'ember-advanced-combobox/configuration';

export function initialize(/* application */) {
  const config = env['ember-advanced-combobox'] || {};
  configuration.load(config);
}

export default {
  name: 'ember-advanced-combobox-read-config',
  initialize
};
