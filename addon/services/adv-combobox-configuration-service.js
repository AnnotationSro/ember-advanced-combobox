import Service from '@ember/service';
import configuration from 'ember-advanced-combobox/configuration';


export default Service.extend({

isTouchDevice: false,

  init(){
    this._super(...arguments);

		window.addEventListener('touchstart', handleTouch, false);
		window.addEventListener('mousemove', handleMouse, false);

		let that = this;

		function handleTouch() {

			window.removeEventListener('touchstart', handleTouch);
			window.removeEventListener('mousemove', handleMouse);

			that.set('isTouchDevice', true);
		}

		function handleMouse() {

			window.removeEventListener('touchstart', handleTouch);
			window.removeEventListener('mousemove', handleMouse);

			that.set('isTouchDevice', false);
		}
  },

  setConfiguration(key, value){
    configuration.getConfig()[key] = value;
  },

  getComboboxConfiguration(){
    return configuration;
  },

  getOnDisabledCallback(){
    return configuration.getConfig().onDisabledCallback;
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
  },

  getNumberOfShownItems() {
    return configuration.getConfig().numberOfShownItems;
  }
});
