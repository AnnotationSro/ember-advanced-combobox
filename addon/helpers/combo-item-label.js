import { helper as buildHelper } from '@ember/component/helper';
import { get } from '@ember/object';

export function comboItemLabel(params/*, hash*/) {
  let [value, itemLabel] = params;
  if (typeof itemLabel === 'string'){
    return get(value, itemLabel);
  }
  if (typeof itemLabel === 'function'){
    return itemLabel(value);
  }
  return value;
}

export default buildHelper(comboItemLabel);
