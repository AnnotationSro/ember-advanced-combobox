import Ember from 'ember';

export function isItemSelected(params/*, hash*/) {
  let list = params[0];
  let item = params[1];

  if (Ember.isEmpty(list) || Ember.isNone(item)){
    return false;
  }

  return list.indexOf(item) > -1;
}

export default Ember.Helper.helper(isItemSelected);
