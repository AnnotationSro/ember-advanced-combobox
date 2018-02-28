import Ember from 'ember';
import configuration from 'ember-advanced-combobox/configuration';


export default Ember.Service.extend({


  setConfiguration(key, value){
    configuration.getConfig()[key] = value;
  },

  getComboboxConfiguration(){
    return configuration;
  },

  getIconStyles(){
    return configuration.getConfig().icons;
  },

  getMinLazyCharacters(){
    return configuration.getConfig().minLazyCharacters;
  },

  getLazyDebounceTime(){
    return configuration.getConfig().lazyDebounceTime;
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
  },

  getEmptyValueListLabel(){
    return configuration.getConfig().emptyValueList;
  },

  getMobileFilterPlaceholder(){
    return configuration.getConfig().mobileFilterPlaceholder;
  },

  getMobileOkButton(){
    return configuration.getConfig().mobileOkButton;
  },

  getMobileCancelButton(){
    return configuration.getConfig().mobileCancelButton;
  }
});
