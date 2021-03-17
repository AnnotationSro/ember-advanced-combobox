import { assign } from '@ember/polyfills';

let CONFIG_PROPERTIES = {
  emptySelectionLabel: '',
  chooseLabel: 'Choose:',
  multiselectValueLabel: 'Selected items:',
  asyncLoaderStartLabel: 'Loading...',
  emptyValueList: 'No items',
  mobileFilterPlaceholder: 'Enter filter here',
  mobileOkButton: 'Confirm',
  mobileCancelButton: 'Cancel',
  lazyDebounceTime: 1000,
  minLazyCharacters: 3,
  numberOfShownItems: 30,
  icons: {
    dropdown: 'fa fa-chevron-down',
    'checkbox-checked': 'fa fa-check-square-o',
    'checkbox-unchecked': 'fa fa-square-o',
    loading: 'fa fa-circle-o-notch fa-spin fa-fw',
    'mobile-filter': 'fa fa-search',
  },
  onDisabledCallback() {},
};

export default {
  load(config) {
    CONFIG_PROPERTIES = assign({}, CONFIG_PROPERTIES, config);
  },

  getConfig() {
    return CONFIG_PROPERTIES;
  },
};
