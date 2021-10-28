import classic from 'ember-classic-decorator';
import Service from '@ember/service';
import configuration from 'ember-advanced-combobox/configuration';

@classic
export default class AdvComboboxConfigurationServiceService extends Service {
	isTouchDevice = false;
	comboboxObjects = {};

	init() {
		super.init(...arguments);

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
	}


	getComboboxObject(comboboxId){
		return this.comboboxObjects[comboboxId];
	}

	_registerComboboxObject(comboboxId){
		this.comboboxObjects[comboboxId] = {};
		return this.getComboboxObject(comboboxId);
	}

	_unregisterComboboxObject(comboboxId){
		delete this.comboboxObjects[comboboxId];
	}

	setConfiguration(key, value) {
		configuration.getConfig()[key] = value;
	}

	getComboboxConfiguration() {
		return configuration;
	}

	getOnDisabledCallback() {
		return configuration.getConfig().onDisabledCallback;
	}

	getIconStyles() {
		return configuration.getConfig().icons;
	}

	getMinLazyCharacters() {
		return configuration.getConfig().minLazyCharacters;
	}

	getLazyDebounceTime() {
		return configuration.getConfig().lazyDebounceTime;
	}

	getChooseLabel() {
		return configuration.getConfig().chooseLabel;
	}

	getEmptySelectionLabel() {
		return configuration.getConfig().emptySelectionLabel;
	}

	getMultiselectValueLabel() {
		return configuration.getConfig().multiselectValueLabel;
	}

	getAsyncLoaderStartLabel() {
		return configuration.getConfig().asyncLoaderStartLabel;
	}

	getEmptyValueListLabel() {
		return configuration.getConfig().emptyValueList;
	}

	getMobileFilterPlaceholder() {
		return configuration.getConfig().mobileFilterPlaceholder;
	}

	getMobileOkButton() {
		return configuration.getConfig().mobileOkButton;
	}

	getMobileCancelButton() {
		return configuration.getConfig().mobileCancelButton;
	}

	getNumberOfShownItems() {
		return configuration.getConfig().numberOfShownItems;
	}
}
