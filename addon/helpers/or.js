import { helper } from '@ember/component/helper';

export function or(params) {
  for (let i=0, len=params.length; i<len; i++) {
    if (params[i]) {
      return params[i];
    }
  }
  return params[params.length-1];
}
export default helper(or);
