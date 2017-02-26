import Ember from 'ember';

let CONFIG_PROPERTIES = {
  emptySelectionLabel: "",
  chooseLabel: "Choose:",
  multiselectValueLabel: "Selected items: ",
  asyncLoaderStartLabel: "Loading...",
  emptyValueList: 'No items',
  mobileFilterPlaceholder: 'Enter filter here',
  mobileOkButton: 'Confirm',
  mobileCancelButton: 'Cancel',
  lazyDebounceTime: 1000,
  minLazyCharacters: 3
};

export default {
  load(config) {
    CONFIG_PROPERTIES = Ember.$.extend(true, {}, CONFIG_PROPERTIES, config);
  },

  getConfig(){
    return CONFIG_PROPERTIES;
  }
};
