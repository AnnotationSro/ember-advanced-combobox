import { helper as buildHelper } from '@ember/component/helper';
import { get } from '@ember/object';
import Ember from 'ember';

export function comboItemLabel(params/*, hash*/) {
  let [value, itemLabel] = params;
  if (typeof itemLabel === 'string'){
    return get(value, itemLabel);
  }
  if (typeof itemLabel === 'function'){
    return itemLabel(value);
  }
  Ember.Logger.error(`ember-advanced-combobox: itemLabel property should be string or function; found ${typeof itemLabel}`);
}

export default buildHelper(comboItemLabel);
