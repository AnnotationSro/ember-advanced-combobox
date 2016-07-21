import Ember from 'ember';
import configuration from 'ember-advanced-combobox/configuration';


export default Ember.Service.extend({


  setConfiguration(key, value){
    configuration.getConfig()[key] = value;
  },

  getComboboxConfiguration(){
    return configuration;
  },

  getChooseLabel(){
    return configuration.getConfig().chooseLabel;
  },

  getEmptySelectionLabel(){
    return configuration.getConfig().emptySelectionLabel;
  },

  getMultiselectValueLabel(){
    return configuration.getConfig().multiselectValueLabel;
  },

  getAsyncLoaderStartLabel(){
    return configuration.getConfig().asyncLoaderStartLabel;
  }
});
