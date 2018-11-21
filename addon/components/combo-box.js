import {
  scheduleOnce,
  next
} from '@ember/runloop';
import {
  isHTMLSafe
} from '@ember/string';
import $ from 'jquery';
import {
  on
} from '@ember/object/evented';
import {
  getOwner
} from '@ember/application';
import {
  get,
  computed,
  observer
} from '@ember/object';
import {
  sort
} from '@ember/object/computed';
import {
  inject as service
} from '@ember/service';
import {
  A
} from '@ember/array';
import Component from '@ember/component';
import {
  isNone,
  isEmpty,
  isPresent
} from '@ember/utils';
import layout from '../templates/components/combo-box';
import {
  accentRemovalHelper
} from '../helpers/accent-removal-helper';
import {
  comboItemLabel
} from '../helpers/combo-item-label';

function getObjectFromArray(array, index) {
  if (array.objectAt) {
    return array.objectAt(index);
  }
  return array[index];
}

function adjustDropdownMaxHeight($dropdown, $input, maxDropdownHeight) {
  $dropdown.css({
    'maxHeight': ''
  });

  let dropdownTop = $dropdown[0].getBoundingClientRect().top;
  let dropdownBottom = $dropdown[0].getBoundingClientRect().bottom;
  let inputTop = $input[0].getBoundingClientRect().top;
  let dropdownHeight = parseFloat($dropdown.css('maxHeight'), 10) || $dropdown.height();

  if (dropdownTop > inputTop) {
    //dropdown is below the input
    if (dropdownTop + dropdownHeight >= window.innerHeight) {
      $dropdown.css({
        'maxHeight': calculateMaxDropdownHeight($dropdown, $input, maxDropdownHeight) + 'px'
      });
    }
  } else {
    if (dropdownHeight >= dropdownBottom) {
      $dropdown.css({
        'maxHeight': calculateMaxDropdownHeight($dropdown, $input, maxDropdownHeight) + 'px'
      });
    }
  }

  function calculateMaxDropdownHeight($dropdown, $input, maxDropdownHeight) {
    let inputBottom = $input[0].getBoundingClientRect().bottom;
    let inputTop = $input[0].getBoundingClientRect().top;

    let height = Math.max(
      window.innerHeight - inputBottom, //dropdown below the input
      inputTop //dropdown above the input
    ) - 10;
    if (isNone(maxDropdownHeight)) {
      maxDropdownHeight = Number.MAX_SAFE_INTEGER;
    }
    return Math.min(height, maxDropdownHeight);
  }
}

export default Component.extend({
  classNames: ['advanced-combo-box'],
  classNameBindings: ['labelOnly:combobox-label-only',
    '_disabledCombobox:combobox-disabled',
    'dropdownVisible:dropdown-visible:dropdown-hidden',
    'isComboFocused:combo-focused',
    'lazyCallbackInProgress:lazy-loading-in-progress'
  ],
  layout,

  disabled: false,
  labelOnly: false,
  valueList: null,
  valuePromise: null, //this will be used to asynchronously retrieve valueList
  selected: null,
  itemKey: null,
  itemLabel: null,
  itemLabelForSelectedPreview: null, //similar to 'itemLabel', but this one is used when creating selected preview label (if not speficied, defaults to 'itemLabel')
  multiselect: false,
  onSelected() {},
  canFilter: false,
  preselectFirst: false,
  orderBy: null,
  noValueLabel: null, //label shown in labelOnly mode when there is no valueList available
  onDropdownShow() {},
  onDropdownHide() {},
  lazyCallback: null,
  abortLazyCallback() {},
  showDropdownButton: true,
  disabledWhenEmpty: true,
  showLabelWhenDisabled: true,
  showChooseLabel: true,
  chooseLabel: null,
  showEmptySelectionLabel: true,
  emptySelectionLabel: null,
  simpleCombobox: false,
  maxDropdownHeight: null,


  //internals
  _popper: null,
  lazyCallbackInProgress: false,
  selectedValueLabel: null,
  dropdownVisible: false,
  internalSelectedList: new A([]), // eslint-disable-line  ember/avoid-leaking-state-in-ember-objects
  valuePromiseResolving: false,
  configurationService: service('adv-combobox-configuration-service'),

  sortedValueList: sort('valueList', function(a, b) {
    let orderBy = this.get('orderBy');
    if (isNone(orderBy)) {
      //no sorting - it would be nice to completely disable this computed property somehow...
      return 0;
    }
    let orderString1 = get(a, orderBy);
    let orderString2 = get(b, orderBy);
    return (orderString1 < orderString2 ? -1 : (orderString1 > orderString2 ? 1 : 0));
  }),

  getMinLazyCharacters() {
    if (this.get('minLazyCharacters') === 0) {
      return 0;
    }
    return this.get('minLazyCharacters') || this.get('configurationService').getMinLazyCharacters();
  },

  _isTesting: computed(function() {
    let config = getOwner(this).resolveRegistration('config:environment');
    return config.environment === 'test';
  }),

  canShowDropdownButton: computed('showDropdownButton', 'lazyCallbackInProgress', function() {
    return this.get('showDropdownButton') && !this.get('lazyCallbackInProgress')
  }),

  init() {

    this._super(...arguments);

    this.initSelectedValues();

    this.createSelectedLabel(this.get('internalSelectedList'));

    let noValueLabel = this.get('noValueLabel');
    if (isEmpty(this.get('valueList')) && isPresent(noValueLabel) && noValueLabel.length > 0) {
      this.set('inputValue', noValueLabel);
    } else {
      this.set('inputValue', this.get('selectedValueLabel'));
    }

    this._handleLabelOnlyNoValue();


    $(document).bind('ember-advanced-combobox-hide-dropdown', () => {
      if (this.get('dropdownVisible') === true) {
        this._hideDropdown();
      }
    });

  },

  didInsertElement() {
    this._super(...arguments);

    //initElement
    let $element = $(this.element);
    let $inputElement = $element.find('.input-group');
    $inputElement.focus(() => {
      this.set('isComboFocused', true);
    });
    $inputElement.blur(() => {
      this.set('isComboFocused', false);
    });

    if (this.get('_isTesting') === false) {
      let onResizeCallback = () => {
        this._initPopper();
      };

      let erd = window.elementResizeDetectorMaker({
        strategy: "scroll"
      });
      erd.listenTo($element.find('.dropdown')[0], onResizeCallback);
      this.set('_erd', erd);
    }

    //setDropdownWidth
    $element.find('.dropdown').css('min-width', $element.css('width'));

    //initInputClickHandler
    $(this.element).find(' *').on('touchstart', (event) => {
      event.stopPropagation();
      if (this.get('_disabledCombobox')) {
        return;
      }
      this._showMobileDropdown();
    });

    $(this.element).find('.combo-input').on('click', () => {
      //comobobox input was clicked on
      if (this.get('_disabledCombobox') || this.get('labelOnly')) {
        //no clicking on input allowed
        return;
      }

      if (isEmpty(this.get('internalSelectedList'))) {
        this.set('inputValue', null);
      }

      if (this.get('simpleCombobox') === false && isNone(this.get('lazyCallback'))) {
        this._showDropdown();
      }
      scheduleOnce('afterRender', this, function() {
        $(this.element).find('.combo-input-with-dropdown').focus();
      });

    });
  },

  willDestroyElement() {
    this._super(...arguments);
    // Ember.$(window).off(`scroll.combobox-scroll-${this.elementId}`);
    this._destroyDropdownCloseListeners();

    let popper = this.get('_popper');
    if (isPresent(popper)) {
      popper.destroy();
    }
    if (this.get('_isTesting') === false && isPresent(this.get('_erd'))) {
      this.get('_erd').uninstall($(this.element).find('.dropdown')[0]);
    }
  },

  //if 'itemLabelForSelectedPreview' is defined, 'itemLabelForSelectedPreview' is used, otherwise 'itemLabel' is used
  internalItemLabelForSelectedPreview: computed('itemLabelForSelectedPreview', 'itemLabel', function() {
    return this.get('itemLabelForSelectedPreview') || this.get('itemLabel');
  }),

  // eslint-disable-next-line ember/no-on-calls-in-components
  disabledComboboxObserver: on('init', observer('_disabledCombobox', 'showLabelWhenDisabled', function() {
    if (this.get('lazyCallbackInProgress') === true) {
      return;
    }
    if (this.get('_disabledCombobox') === true) {
      if (this.get('showLabelWhenDisabled') === false) {
        this.set('inputValue', '');
      } else {
        this.set('inputValue', this.get('selectedValueLabel'));
      }
    }
  })),

  tabbable: computed('labelOnly', '_disabledCombobox', function() {
    return this.get('labelOnly') || this.get('_disabledCombobox');
  }),

  initSelectedValues() {
    //find selected items and assgn them into internalSelectedList
    let selected = this.get('selected');

    if (isPresent(selected)) {
      let itemsArray = this._itemKeysListToItemObjects(selected);
      this.set('internalSelectedList', itemsArray);
      this.createSelectedLabel(itemsArray);
      if (!this.get('dropdownVisible') && isNone(this.get('lazyCallback'))) {
        this.set('inputValue', this.get('selectedValueLabel'));
      }
    } else {
      this.set('internalSelectedList', A([]));
    }

    this._automaticallySelect();
  },

  labelOnlyObserver: observer('labelOnly', function() {
    let selectedItems = this.get('internalSelectedList');
    if (this.get('labelOnly')) {
      this._handleLabelOnlyNoValue();
    } else {
      let noValueLabel = this.get('noValueLabel');
      if (isEmpty(this.get('valueList')) && isPresent(noValueLabel) && noValueLabel.length > 0) {
        this.set('inputValue', noValueLabel);
      } else {
        this.createSelectedLabel(selectedItems);
        this.set('inputValue', this.get('selectedValueLabel'));
      }
    }
  }),


  inputValueObserver: observer('inputValue', function() {
    if (isPresent(this.get('lazyCallback')) && this.get('simpleCombobox') === false) {
      // this._hideDropdown(false, false);
    }
  }),

  filteredValueList: computed('inputValue', 'sortedValueList.[]', 'valueList.[]', function() {
    let valueList = null;
    if (isPresent(this.get('orderBy'))) {
      valueList = this.get('sortedValueList');
    } else {
      valueList = this.get('valueList');
    }

    if (!this.get('canFilter')) {
      return valueList;
    }

    if (isEmpty(valueList)) {
      return valueList;
    }

    var filterQuery = this.get('inputValue');
    if (isEmpty(filterQuery)) {
      //no filter is entered
      return valueList;

    } else {
      if (isHTMLSafe(filterQuery)) {
        filterQuery = filterQuery.toString();
      }
      filterQuery = accentRemovalHelper(String(filterQuery).toLowerCase());

      //filter the list
      let filteredValueList = valueList.filter((value) => {
        let valueLabel = this._getItemLabel(value);
        if (isHTMLSafe(valueLabel)) {
          valueLabel = valueLabel.toString();
        }

        valueLabel = accentRemovalHelper(String(valueLabel).toLowerCase());
        return valueLabel.indexOf(filterQuery) > -1;
      });

      return filteredValueList;
    }
  }),

  /**
   * if combobox is in labelOnly mode and there is no internalSelectedList, show noValueLabel
   */
  _handleLabelOnlyNoValue() {
    if (this.get('labelOnly')) {
      if (isEmpty(this.get('internalSelectedList'))) {
        this.set('inputValue', this.get('noValueLabel'));
      }
    }
  },

  _itemKeysListToItemObjects(itemKeyList) {
    let items;
    if (Array.isArray(itemKeyList)) {
      items = [];
      itemKeyList.forEach((itemKey) => {
        let item = this.findItemByKey(itemKey);
        if (item) {
          items.push(item);
        }
      });
    } else {
      let item = this.findItemByKey(itemKeyList);
      if (item) {
        items = [item];
      }
    }
    return new A(items);
  },

  findItemByKey(key) {
    let items = this.get('valueList');
    if (isNone(items)) {
      if (isPresent(this.get('lazyCallback')) && this.get('selected') === key) {
        return key;
      }
      return null;
    }
    let itemsLength = this.getValueListLength();
    for (let i = 0; i < itemsLength; i++) {
      if (this._getItemKey(getObjectFromArray(items, i)) === key) {
        return getObjectFromArray(items, i);
      }
    }

    return null;
  },

  getValueListLength() {
    if (isEmpty(this.get('valueList'))) {
      return 0;
    }

    let itemsLength = this.get('valueList').length;
    if (typeof itemsLength !== 'number') {
      //it looks like valueList.length is a computedProperty
      itemsLength = this.get('valueList.length');
    }
    return itemsLength;
  },

  selectedObserver: observer('selected', function() {
    let selected = this.get('selected');
    if (isEmpty(selected)) {
      this.set('internalSelectedList', new A([]));
      this.createSelectedLabel(null);
      if (!this.get('canFilter') || !this.get('dropdownVisible')) {
        this.set('inputValue', this.get('selectedValueLabel'));
      }
      return;
    }
    let itemsArray = this._createArray(selected);
    itemsArray = itemsArray.map((itemKey) => this.findItemByKey(itemKey) || itemKey);

    this.set('internalSelectedList', this._createArray(itemsArray));
    this.createSelectedLabel(itemsArray);
    if (!this.get('dropdownVisible')) {
      this.set('inputValue', this.get('selectedValueLabel'));
    }
  }),

  // eslint-disable-next-line ember/no-on-calls-in-components
  valuePromiseObserver: on('init', observer('valuePromise', function() {
    if (this.get('valuePromise') && isEmpty(this.get('valueList'))) {
      this.set('valuePromiseResolving', true);
      this._changeDropdownPosition();

      this.get('valuePromise').then((result) => {

        this.set('valuePromiseResolving', false);
        this.set('valueList', result);

        this.notifyPropertyChange('sortedValueList');

      });
    }
  })),


  valueListObserver: observer('valueList.[]', function() {
    if (this.get('simpleCombobox') === true) {
      return;
    }
    if (isEmpty(this.get('valueList')) && isPresent(this.get('noValueLabel'))) {
      this.set('inputValue', this.get('noValueLabel'));
      return;
    }
    this.initSelectedValues();
    if (isNone(this.get('valueList'))) {
      let noValueLabel = this.get('noValueLabel');
      if (isPresent(noValueLabel)) {
        this.set('inputValue', noValueLabel);
      }
      return;
    }
    if ((isEmpty(this.get('internalSelectedList')) && isEmpty(this.get('selected'))) && !this.get('dropdownVisible') && isNone(this.get('lazyCallback'))) {
      let chooseLabel = isPresent(this.get('chooseLabel')) ? this.get('chooseLabel') : this.get('configurationService').getChooseLabel();
      if (this.get('showChooseLabel') === false) {
        chooseLabel = null;
      }
      this.set('inputValue', chooseLabel);
    } else {
      if (isNone(this.get('lazyCallback'))) {
        let selectedKeys = this._itemKeysListToItemObjects(this.get('selected'));
        if (isEmpty(selectedKeys)) {
          //selected value is not within the new valueList
          this.set('inputValue', '');
        }
      }
    }

  }),

  _callOnSelectedCallback(newSelectedList, oldSelectedList) {
    //call onSelected callback only if selected items actually changed
    if (this._equalsSelectedList(oldSelectedList, newSelectedList)) {
      return;
    }

    let newList = this._itemKeysListToItemObjects(newSelectedList);

    if (this.get('multiselect')) {
      this.get('onSelected')(newList);
    } else {
      if (!isEmpty(newList)) {
        this.get('onSelected')(getObjectFromArray(newList, 0));
      } else {
        this.get('onSelected')(null);
      }
    }
  },

  _disabledCombobox: computed('disabled', 'valueList.[]', 'labelOnly', 'noValueLabel', 'lazyCallback', function() {
    if (this.get('disabled')) {
      return true;
    }

    if (this.get('labelOnly') || isPresent(this.get('lazyCallback'))) {
      return false;
    }

    if (isEmpty(this.get('valueList')) && this.get('disabledWhenEmpty') === true) {
      //if there is no valueList, but 'noValueLabel' is specified, then combobox is not in disabled state - it should show 'noValueLabel' instead
      if (isPresent(this.get('noValueLabel'))) {
        return false;
      }

      return true;
    }

    return false;
  }),

  //we cannot use {{input readonly=readonly}} because of bug https://github.com/emberjs/ember.js/issues/11828
  // eslint-disable-next-line ember/no-on-calls-in-components
  inputNotClickableObserver: on('init', observer('_disabledCombobox', 'labelOnly', 'valueList.[]', 'canFilter', 'lazyCallback', function() {
    let notClickable = false;
    if (this.get('_disabledCombobox')) {
      notClickable = true;
    }
    if (this.get('labelOnly')) {
      notClickable = true;
    }
    if (isEmpty(this.get('valueList')) && isNone(this.get('lazyCallback'))) {
      notClickable = true;
    }
    if (this.get('canFilter') === false && isNone(this.get('lazyCallback'))) {
      notClickable = true;
    }

    scheduleOnce('afterRender', this, function() {
      $(this.element).find('.combo-input').prop('readonly', notClickable);
      $(this.element).find('.input-wrapper').attr('readonly', notClickable);
    });

  })),

  filterObserver: observer('inputValue', function() {
    if (this.get('dropdownVisible') && this.get('canFilter')) {
      this._changeDropdownPosition();
    }
  }),
  //
  // comboFocusedObserver: observer('isComboFocused', 'lazyCallback', function() {
  //   if (this.get('isComboFocused') === true && isNone(this.get('lazyCallback'))) {
  //     this._showDropdown();//no lazy present
  //   } else {
  //     this.setLazyDebounce('', true);//lazy is present
  //   }
  // }),

  asyncLoaderStartLabel: computed(function() {
    return this.get('configurationService').getAsyncLoaderStartLabel();
  }),

  emptyValueListLabel: computed(function() {
    return this.get('configurationService').getEmptyValueListLabel();
  }),

  mobileFilterPlaceholder: computed(function() {
    return this.get('configurationService').getMobileFilterPlaceholder();
  }),

  mobileOkButton: computed(function() {
    return this.get('configurationService').getMobileOkButton();
  }),

  mobileCancelButton: computed(function() {
    return this.get('configurationService').getMobileCancelButton();
  }),

  /**
   * creates Ember's MutableArray from either single object or array (array may be a plain JS array or Ember MutableArray)
   */
  _createArray(object) {
    if (isNone(object)) {
      return new A([]);
    }
    if (object.map) {
      //it is an array
      if (object.objectAt) {
        //it is an Ember MutableArray
        return object;
      } else {
        //it is a plain JS array
        return new A(object);
      }
    } else {
      return new A([object]);
    }
  },

  _getItemKey(item) {
    if (isNone(item)) {
      return null;
    }
    if (isPresent(this.get('itemKey'))) {
      return get(item, this.get('itemKey'));
    } else {
      //if no itemKey is specified, use the item object itself
      return item;
    }
  },

  _getItemLabel(item) {
    if (isPresent(this.get('itemLabel'))) {
      return comboItemLabel([item, this.get('itemLabel')]);
    } else {
      //if no itemLabel is specified, use the item object itself
      return item;
    }
  },

  _getPropertyFromItem(item, property) {
    if (isPresent(property) && isPresent(item) && typeof item !== 'string') {
      return get(item, property);
    } else {
      return item;
    }
  },

  _showDropdown() {
    if (this.get('dropdownVisible')) {
      //dropdown is already visible
      return;
    }

    if (isPresent(this.get('lazyCallback'))) {
      let minLazyCharacters = this.getMinLazyCharacters();
      //if combobox is lazy and there are not enough characters - do not show the dropdown
      if (isPresent(this.get('inputValue')) && this.get('inputValue').length < minLazyCharacters) {
        return;
      }
    }

    this.set('dropdownVisible', true);

    this.get('onDropdownShow')();

    let oldKeys = this.get('selected');
    if (isEmpty(oldKeys) && isPresent(this.get('internalSelectedList'))) {
      oldKeys = this.get('internalSelectedList').map((sel) => this._getItemKey(sel));
    }

    this.set('oldInternalSelectionKeys', this._createArray(oldKeys));
    if (this.get('canFilter')) {
      if (isNone(this.get('lazyCallback'))) {
        //when we are using lazyCallback, do not clear inputValue, otherwise clear it
        this.set('inputValue', '');
      }
    } else {
      if (isNone(this.get('lazyCallback'))) {

        let chooseLabel = this.get('configurationService').getChooseLabel();
        if (this.get('showChooseLabel') === false) {
          chooseLabel = null;
        }
        this.set('inputValue', chooseLabel);
      }
    }

    this._initDropdownCloseListeners();

    this._initPopper();

    let $element = $(this.element);
    let $dropdown = $element.find('.dropdown');
    let $input = $element.find('.combo-input');
    adjustDropdownMaxHeight($dropdown, $input, this.get('maxDropdownHeight'));
  },

  _initPopper() {
    if (isPresent(this.get('_popper'))) {
      let popperOld = this.get('_popper');
      popperOld.destroy();
    }
    if (this.get('dropdownVisible') === false) {
      return;
    }

    let $element = $(this.element);
    let $dropdown = $element.find('.dropdown');
    let $input = $element.find('.input-group');

    let popper = new window.Popper($input[0], $dropdown[0], {
      placement: 'bottom-start',
      positionFixed: true,
      modifiers: {
        preventOverflow: {
          boundariesElement: 'viewport'
        }
      }
    });
    this.set('_popper', popper);
  },

  _showMobileDropdown() {
    this.set('mobileDropdownVisible', true);

    this.get('onDropdownShow')();

    this.set('oldInternalSelectionKeys', this._createArray(this.get('selected')));

    if (this.get('canFilter')) {
      if (isNone('lazyCallback')) {
        //when we are using layzCallback, do not clear inputValue, otherwise clear it
        this.set('inputValue', '');
      }
    } else {
      if (isNone('lazyCallback')) {
        let chooseLabel = isPresent(this.get('chooseLabel')) ? this.get('chooseLabel') : this.get('configurationService').getChooseLabel();
        if (this.get('showChooseLabel') === false) {
          chooseLabel = null;
        }
        this.set('inputValue', chooseLabel);
      }
    }
  },

  _changeDropdownPosition() {
    scheduleOnce('afterRender', this, function() {
      let $element = $(this.element);
      let $dropdown = $element.find('.dropdown');
      let $input = $element.find('.combo-input');
      adjustDropdownMaxHeight($dropdown, $input, this.get('maxDropdownHeight'));
    });
  },

  _hideDropdown(acceptSelected, resetInput = true) {

    if ((this.get('isDestroyed') || this.get('isDestroying'))) {
      return;
    }

    this.cancelLazyDebounce();

    $(this.element).find('.dropdown').css({
      'maxHeight': ''
    });

    this.get('onDropdownHide')();

    // Ember.$(window).off(`scroll.combobox-scroll-${this.elementId}`);
    this.set('dropdownVisible', false);
    this.set('mobileDropdownVisible', false);

    scheduleOnce('afterRender', this, () => {

      let popper = this.get('_popper');
      if (isPresent(popper)) {
        popper.destroy();
        this.set('_popper', null);
      }
    });

    if (acceptSelected) {
      //call selection callback
      this._callOnSelectedCallback(this.convertItemListToKeyList(this.get('internalSelectedList')), this.get('oldInternalSelectionKeys'));
    } else {
      //selection is not accepted -> revert internal selection
      this.set('internalSelectedList', this._itemKeysListToItemObjects(this.get('oldInternalSelectionKeys')));
    }

    let noValueLabel = this.get('noValueLabel');

    if (resetInput) {
      if (isEmpty(this.get('internalSelectedList')) &&
        isPresent(noValueLabel) &&
        noValueLabel.length > 0
      ) {
        this.set('inputValue', noValueLabel);
      } else {
        this.createSelectedLabel(this.get('internalSelectedList'));
        this.set('inputValue', this.get('selectedValueLabel'));
      }
    }

    this._destroyDropdownCloseListeners();

  },

  _equalsSelectedList(list1, list2) {
    if (isNone(list1) && isNone(list2)) {
      //both of them are null/undefined
      return true;
    }
    if (isNone(list1) || isNone(list2)) {
      //just one of them is null/undefined
      return false;
    }
    if (list1.length !== list2.length) {
      return false;
    }

    let removeObjects = list1.removeObjects(list2);
    return (removeObjects.length === 0);
  },

  convertItemListToKeyList(itemList) {
    if (isEmpty(itemList)) {
      return null;
    }
    return itemList.map((item) => this._getItemKey(item));
  },

  createSelectedLabel(items) {
    let label = null;
    if (isEmpty(items)) {
      //no items were selected
      if (isPresent(this.get('selected')) && isPresent(this.get('noValueLabel'))) {
        label = this.get('noValueLabel');
      } else {
        if (this.get('showEmptySelectionLabel') === true) {
          label = (isPresent(this.get('emptySelectionLabel')) || this.get('emptySelectionLabel') === '') ? this.get('emptySelectionLabel') : this.get("configurationService").getEmptySelectionLabel();
        }
      }
    } else {
      if (items.map) {
        //multiple items are selected
        if (items.length === 1) {
          label = this._createLabel(getObjectFromArray(items, 0), this.get('internalItemLabelForSelectedPreview'));
        } else {
          label = this.get("configurationService").getMultiselectValueLabel() + items.length;
        }
      } else {
        //single item is selected
        label = this._createLabel(items, this.get('internalItemLabelForSelectedPreview'));
      }
    }
    this.set('selectedValueLabel', label);
  },

  _createLabel(items, labelProperty) {
    if (typeof labelProperty === 'function') {
      return labelProperty(items);
    }
    return this._getPropertyFromItem(items, labelProperty);
  },

  _addOrRemoveFromSelected(item) {
    if (!this.get('multiselect')) {
      //single select combobox does not perform any selected items removal
      this.get('internalSelectedList').clear();
      this._addOrRemoveFromList(this.get('internalSelectedList'), item);
    } else {
      //if multiselect combobox, first check if object is not already in selected list
      let selectedList = this.get('internalSelectedList');
      if (isNone(selectedList)) {
        this.set('internalSelectedList', new A([]));
      } else {
        this._addOrRemoveFromList(this.get('internalSelectedList'), item);
      }
    }
  },

  _selectItem(item) {
    this._addOrRemoveFromSelected(item);
    if (!this.get('multiselect')) {
      this._hideDropdown(true);
    }
  },

  _addOrRemoveFromList(list, item) {
    let itemPos = list.indexOf(item);
    if (itemPos === -1) {
      //item is not in the list - we should add it
      list.addObject(item);
    } else {
      //item is in the list - we should remove it
      list.removeAt(itemPos, 1);
    }
  },

  /**
   * register event listeners to handle clicking outside of combobox to close it
   */
  _initDropdownCloseListeners() {
    scheduleOnce('afterRender', this, () => {

      var hideDropdown = (event) => {

        //click on arrow button
        let $combo = $(this.element);
        if (isElementClicked($combo.find('.dropdown-icon'), event)) {
          this._hideDropdown(false);
          return;
        }

        //click into input
        if (isElementClicked($combo.find('.combo-input'), event)) {
          if (this.get('canFilter') || isPresent(this.get('lazyCallback'))) {
            //do nothing - let the user enter the filter
            return;
          } else {
            this._hideDropdown(false);
          }
        }

        //click somewhere outside the combobox
        if (!isElementClicked($combo, event)) {
          if (this.get('dropdownVisible')) {

            //multiselect checkboxes should not trigger dropdown collapse

            if ($(event.target).hasClass('do-not-hide-dropdown')) {
              return;
            }

            if (this.get('multiselect')) {
              this._hideDropdown(true);
            } else {
              this._hideDropdown(false);
            }

          }
        }

        return true;
      };

      if (this.get('dropdownVisible')) {
        $('body').on(`click.hideDropdown_${this.elementId}`, hideDropdown);
      }
    });

    function isElementClicked($element, event) {
      if (!$element.is(event.target) && $element.has(event.target).length === 0) {
        return false;
      }
      return true;

    }
  },

  /**
   * - if there is only one item in valueList -> select it
   * - if "preselectFirst" is set to true, select first item in valueList
   */
  _automaticallySelect() {
    if (isPresent(this.get('selected'))) {
      //do not automatically select if something is already selected
      return;
    }

    let valueList = this.get('valueList');
    if (isEmpty(valueList)) {
      return;
    }
    if (this.getValueListLength() === 1) {
      //only 1 item in value list
      //
      next(this, function() {
        this._selectItem(getObjectFromArray(valueList, 0));
      });
      return;
    }

    if (this.get('preselectFirst') === true) {
      //preselect item
      next(this, function() {
        this._selectItem(getObjectFromArray(valueList, 0));
      });
      return;
    }
  },

  _destroyDropdownCloseListeners() {
    $('body').off(`click.hideDropdown_${this.elementId}`);
  },

  cancelLazyDebounce() {
    if (isPresent(this.get('lazyDebounce'))) {
      this.get('abortLazyCallback')();

      clearTimeout(this.get('lazyDebounce'));
      this.set('lazyDebounce', null);
    }
  },

  setLazyDebounce(inputValue, runImmidiate = false) {
    this.cancelLazyDebounce();

    let chooseLabel = isPresent(this.get('chooseLabel')) ? this.get('chooseLabel') : this.get('configurationService').getChooseLabel();

    if (this.get('showChooseLabel') === true && inputValue === chooseLabel) {
      inputValue = '';
    }

    let debounceTime = this.get('configurationService').getLazyDebounceTime();
    if (runImmidiate === true) {
      debounceTime = 0;
    }

    let debounceTimer = setTimeout(() => {
      this.set('lazyCallbackInProgress', true);
      let promise = this.get('lazyCallback')(inputValue);
      this.set('valueList', null);
      this.set('valuePromise', promise);
      promise.then(() => {

        scheduleOnce('afterRender', this, function() {
          this._showDropdown();
          if (this.get('simpleCombobox') === true && isNone(this.get('lazyCallback'))) {
            this.set('inputValue', null);
          }
          this.set('lazyCallbackInProgress', false);
        });
      });


    }, debounceTime);

    this.set('lazyDebounce', debounceTimer);
  },

  actions: {

    inputValueChanged() {
      let lazyCallback = this.get('lazyCallback');
      let inputValue = this.get('inputValue');
      if (isPresent(lazyCallback) && isPresent(inputValue)) {

        if (inputValue.trim().length < this.getMinLazyCharacters()) {
          this.cancelLazyDebounce();
          if (this.get('dropdownVisible')) {
            this._hideDropdown(false, false);
          }
        } else {
          this.setLazyDebounce(inputValue);
        }
      }

      if (isPresent(this.get('lazyCallback'))) {
        if (isEmpty(this.get('inputValue')) || this.get('inputValue').length === 0) {
          //clear selection
          this.set('internalSelectedList', A([]));
          this._callOnSelectedCallback(this.convertItemListToKeyList(this.get('internalSelectedList')), this.get('oldInternalSelectionKeys'));
        }
      }
    },

    actionDropdownButton() {
      if (this.get('_disabledCombobox')) {
        return;
      }
      if (this.get('dropdownVisible')) {
        this._hideDropdown(true);
      } else {
        if (isEmpty(this.get('valueList')) && isPresent(this.get('lazyCallback'))) {
          this.setLazyDebounce('', true);
          return;
        }
        $(document).trigger('ember-advanced-combobox-hide-dropdown');
        this._showDropdown();
      }
    },

    actionItemSelect(item) {
      this._selectItem(item);
    },

    actionCancelMobile() {
      this.set('mobileDropdownVisible', false);
    },

    actionAcceptMobile() {
      this._hideDropdown(true);
    }
  }
});
