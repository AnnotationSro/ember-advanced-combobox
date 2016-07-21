import Ember from 'ember';

let CONFIG_PROPERTIES = {
  emptySelectionLabel: "",
  chooseLabel: "Choose:",
  multiselectValueLabel: "Selected items: ",
  asyncLoaderStartLabel: "Loading..."
};

export default {
  load(config) {
    CONFIG_PROPERTIES = Ember.$.extend(true, {}, CONFIG_PROPERTIES, config);
  },

  getConfig(){
    return CONFIG_PROPERTIES;
  }
};
