import { helper as buildHelper } from '@ember/component/helper';
import { isEmpty, isNone } from '@ember/utils';

export function isItemSelected(params/*, hash*/) {
  let list = params[0];
  let item = params[1];

  if (isEmpty(list) || isNone(item)){
    return false;
  }

  return list.indexOf(item) > -1;
}

export default buildHelper(isItemSelected);
