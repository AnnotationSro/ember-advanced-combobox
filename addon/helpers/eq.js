import { helper as buildHelper } from '@ember/component/helper';

export function isItemSelected(params/*, hash*/) {
  return params[0] === params[1];
}

export default buildHelper(isItemSelected);
