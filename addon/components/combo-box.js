import Ember from 'ember';
import layout from '../templates/components/combo-box';
import isHtmlSafe from 'ember-string-ishtmlsafe-polyfill';
import {
  accentRemovalHelper
} from '../helpers/accent-removal-helper';


function getObjectFromArray(array, index) {
  if (array.objectAt) {
    return array.objectAt(index);
  }
  return array[index];
}


const SPACE = 5;

function positionDropdown($dropdown, $input) {

  let {
    left,
    top
  } = $input[0].getBoundingClientRect();

  if (top + $dropdown.outerHeight() + SPACE <= Ember.$(window).height()) {
    //dropdown has enough space to be rendered below the input

    showDropdownBelowInput($dropdown, left, top, $input.outerHeight());
  } else {
    //try and show dropdown above input
    if ($dropdown.outerHeight() + SPACE <= Ember.$(window).height()) {
      showDropdownAboveInput($dropdown, left, top, $dropdown.outerHeight());
    } else {
      //still cannot position a dropdown
      showDropdownBelowInput($dropdown, left, top, $input.outerHeight());
    }
  }


  function showDropdownBelowInput($dropdown, left, top, inputHeight) {
    $dropdown.css('left', `${left}px`);
    $dropdown.css('top', `${top + inputHeight + SPACE}px`);

  }

  function showDropdownAboveInput($dropdown, left, top, dropdownHeight) {

    $dropdown.css('left', `${left}px`);
    $dropdown.css('top', `${top - dropdownHeight - SPACE}px`);
  }
}

export default Ember.Component.extend({
  classNames: ['advanced-combo-box'],
  classNameBindings: ['labelOnly:combobox-label-only', '_disabledCombobox:combobox-disabled', 'dropdownVisible:dropdown-visible:dropdown-hidden'],
  layout,

  disabled: false,
  labelOnly: false,
  valueList: null,
  valuePromise: null, //this will be used to asynchronously retrieve valueList
  selected: null,
  itemKey: null,
  itemLabel: null,
  multiselect: false,
  onSelected: Ember.K,
  canFilter: false,
  preselectFirst: false,
  orderBy: null,
  noValueLabel: null, //label shown in labelOnly mode when there is no valueList available

  //internals
  selectedValueLabel: null,
  dropdownVisible: false,
  internalSelectedList: Ember.A([]),

  configurationService: Ember.inject.service('adv-combobox-configuration-service'),

  sortedValueList: Ember.computed.sort('valueList', function(a, b) {
    let orderBy = this.get('orderBy');
    if (Ember.isNone(orderBy)) {
      //no sorting - it would be nice to completely disable this computed property somehow...
      return 0;
    }
    let orderString1 = Ember.get(a, orderBy);
    let orderString2 = Ember.get(b, orderBy);
    return (orderString1 < orderString2 ? -1 : (orderString1 > orderString2 ? 1 : 0));
  }),

  initCombobox: Ember.on('init', function() {

    this.initSelectedValues();

    this.createSelectedLabel(this.get('internalSelectedList'));
    this.set('inputValue', this.get('selectedValueLabel'));

    this._handleLabelOnlyNoValue();

  }),

  onDestroy: Ember.on('didDestroyElement', function() {
    Ember.$(window).off(`scroll.combobox-scroll-${this.elementId}`);
    this._destroyDropdownCloseListeners();
  }),

  initSelectedValues() {
    //find selected items and assgn them into internalSelectedList
    let selected = this.get('selected');

    if (Ember.isPresent(selected)) {
      let itemsArray = this._itemKeysListToItemObjects(selected);
      this.set('internalSelectedList', itemsArray);
      this.createSelectedLabel(itemsArray);
      this.set('inputValue', this.get('selectedValueLabel'));
    }

    this._automaticallySelect();
  },

  labelOnlyObserver: Ember.observer('labelOnly', function() {
    let selectedItems = this.get('internalSelectedList');
    if (this.get('labelOnly')) {
      this._handleLabelOnlyNoValue();
    } else {
      this.createSelectedLabel(selectedItems);
      this.set('inputValue', this.get('selectedValueLabel'));
    }
  }),

  filteredValueList: Ember.computed('inputValue', 'sortedValueList.[]', function() {

    let valueList = this.get('sortedValueList');

    if (!this.get('canFilter')) {
      return valueList;
    }

    if (Ember.isEmpty(valueList)) {
      return valueList;
    }

    var filterQuery = this.get('inputValue');
    if (Ember.isEmpty(filterQuery)) {
      //no filter is entered
      return valueList;

    } else {
      if (isHtmlSafe(filterQuery)) {
        filterQuery = filterQuery.toString();
      }
      filterQuery = accentRemovalHelper(String(filterQuery).toLowerCase());

      //filter the list
      let filteredValueList = valueList.filter((value) => {
        let valueLabel = this._getItemLabel(value);
        if (isHtmlSafe(valueLabel)) {
          valueLabel = valueLabel.toString();
        }

        valueLabel = accentRemovalHelper(String(valueLabel).toLowerCase());
        return valueLabel.indexOf(filterQuery) > -1;
      });

      return filteredValueList;
    }
  }),

  /**
   * if combobox is in labelOnly mode and there is no valueList, show noValueLabel
   */
  _handleLabelOnlyNoValue() {
    if (this.get('labelOnly')) {
      if (Ember.isNone(this.get('valueList'))) {
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
          itemKeyList.push(item);
        }
      });
    } else {
      let item = this.findItemByKey(itemKeyList);
      if (item) {
        items = [item];
      }
    }
    return new Ember.A(items);
  },

  findItemByKey(key) {
    let items = this.get('valueList');
    if (Ember.isNone(items)) {
      return null;
    }
    for (let i = 0; i < items.length; i++) {
      if (this._getItemKey(getObjectFromArray(items, i)) === key) {
        return getObjectFromArray(items, i);
      }
    }

    return null;
  },

  selectedObserver: Ember.observer('selected', function() {
    let selected = this.get('selected');
    if (Ember.isEmpty(selected)) {
      this.set('internalSelectedList', null);
      this.createSelectedLabel(null);
      this.set('inputValue', this.get('selectedValueLabel'));
      return;
    }
    let itemsArray = this._createArray(selected);
    itemsArray = itemsArray.map((itemKey) => this.findItemByKey(itemKey));

    this.set('internalSelectedList', itemsArray);
    this.createSelectedLabel(itemsArray);
    this.set('inputValue', this.get('selectedValueLabel'));
  }),

  valuePromiseObserver: Ember.on('init', Ember.observer('valuePromise', function() {
    if (Ember.isPresent(this.get('valuePromise'))) {

      this.set('inputValue', this.get('configurationService').getAsyncLoaderStartLabel());
      
      this.get('valuePromise').then((result) => {
        this.set('valueList', result);
        this.set('inputValue', this.get('selectedValueLabel'));
      });
    }
  })),


  valueListObserver: Ember.observer('valueList.[]', function() {
    let oldSelected = this.get('internalSelectedList');
    this.initSelectedValues();

    this._callOnSelectedCallback(this.get('internalSelectedList'), oldSelected);

  }),

  _callOnSelectedCallback(newSelectedList, oldSelectedList) {
    //call onSelected callback only if selected items actually changed
    if (this._equalsSelectedList(oldSelectedList, newSelectedList)) {
      return;
    }

    if (this.get('multiselect')) {
      this.get('onSelected')(newSelectedList);
    } else {
      if (Ember.isEmpty(newSelectedList)) {
        this.get('onSelected')(null);
      } else {
        this.get('onSelected')(getObjectFromArray(newSelectedList, 0));
      }
    }
  },

  _disabledCombobox: Ember.computed('disabled', 'valueList.[]', function() {
    if (this.get('disabled') || Ember.isEmpty(this.get('valueList'))) {
      return true;
    }
    return false;
  }),

  //we cannot use {{input readonly=readonly}} because of bug https://github.com/emberjs/ember.js/issues/11828
  inputNotClickableObserver: Ember.on('init', Ember.observer('_disabledCombobox', 'labelOnly', 'valueList.[]', 'canFilter', function() {
    let notClickable = false;
    if (this.get('_disabledCombobox')) {
      notClickable = true;
    }
    if (this.get('labelOnly')) {
      notClickable = true;
    }
    if (Ember.isEmpty(this.get('valueList'))) {
      notClickable = true;
    }
    if (this.get('canFilter') === false) {
      notClickable = true;
    }

    Ember.run.scheduleOnce('afterRender', this, function() {
      Ember.$(this.element).find('.combo-input').prop('readonly', notClickable);
    });

  })),

  initInputClickHandler: Ember.on('didInsertElement', function() {

    Ember.$(this.element).find('.combo-input').on('click tap', () => {
      //comobobox input was clicked (or taped) on
      if (this.get('_disabledCombobox') || this.get('labelOnly')) {
        //no clicking on input allowed
        return;
      }

      this.set('inputValue', '');

      this._showDropdown();
      Ember.run.scheduleOnce('afterRender', this, function() {
        Ember.$(this.element).find('.combo-input-with-dropdown').focus();
      });

    });
  }),

  filterObserver: Ember.observer('inputValue', function() {
    if (this.get('dropdownVisible') && this.get('canFilter')) {
      this._changeDropdownPosition();
    }
  }),

  /**
   * creates Ember's MutableArray from either single object or array (array may be a plain JS array or Ember MutableArray)
   */
  _createArray(object) {
    if (object.map) {
      //it is an array
      if (object.objectAt) {
        //it is an Ember MutableArray
        return object;
      } else {
        //it is a plain JS array
        return new Ember.A(object);
      }
    } else {
      return new Ember.A([object]);
    }
  },

  _getItemKey(item) {
    if (Ember.isPresent(this.get('itemKey'))) {
      return Ember.get(item, this.get('itemKey'));
    } else {
      //if no itemKey is specified, use the item object itself
      return item;
    }
  },

  _getItemLabel(item) {
    if (Ember.isPresent(this.get('itemLabel'))) {
      return Ember.get(item, this.get('itemLabel'));
    } else {
      //if no itemLabel is specified, use the item object itself
      return item;
    }
  },

  _showDropdown() {
    this.set('dropdownVisible', true);

    this.set('oldInternalSelection', new Ember.A(this.get('internalSelectedList')));
    if (this.get('canFilter')) {
      this.set('inputValue', null);
    } else {
      this.set('inputValue', this.get('configurationService').getChooseLabel());
    }

    this._initDropdownCloseListeners();

    this._changeDropdownPosition();
    Ember.$(window).on(`scroll.combobox-scroll-${this.elementId}`, () => {
      this._hideDropdown();
    });
  },

  _changeDropdownPosition() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      let $element = Ember.$(this.element);
      let $dropdown = $element.find('.dropdown');
      let $input = $element.find('.combo-input');
      positionDropdown($dropdown, $input);

      $dropdown.css('width', $input.outerWidth());
    });
  },

  _hideDropdown(acceptSelected) {
    Ember.$(window).off(`scroll.combobox-scroll-${this.elementId}`);
    this.set('dropdownVisible', false);

    if (acceptSelected) {
      //call selection callback
      let selectedItems = this.get('internalSelectedList');
      this._callOnSelectedCallback(this.convertItemListToKeyList(selectedItems), this._itemKeysListToItemObjects(this.get('selected')));
    } else {
      //selection is not accepted -> revert internal selection
      this.set('internalSelectedList', this.get('oldInternalSelection'));
    }

    this.createSelectedLabel(this.get('internalSelectedList'));
    this.set('inputValue', this.get('selectedValueLabel'));
    this._destroyDropdownCloseListeners();

  },

  _equalsSelectedList(list1, list2) {
    if (list1.length !== list2.length) {
      return false;
    }

    for (let i = 0; i < list1.length; i++) {
      let item1 = getObjectFromArray(list1, i);
      let item2 = getObjectFromArray(list2, i);

      if (this._getItemKey(item1) !== this._getItemKey(item2)) {
        return false;
      }

      return true;
    }

    return Ember.compare(list1, list2) === 0;
  },

  convertItemListToKeyList(itemList) {
    if (Ember.isEmpty(itemList)) {
      return null;
    }
    return itemList.map((item) => this._getItemKey(item));
  },

  createSelectedLabel(items) {
    let label = null;
    if (Ember.isEmpty(items)) {
      //no items were selected
      if (Ember.isEmpty(this.get('valueList'))) {
        label = ''; //no valueList
      } else {
        label = this.get("configurationService").getEmptySelectionLabel();
      }
    } else {
      if (items.map) {
        //multiple items are selected
        if (items.length === 1) {
          label = this._getItemLabel(getObjectFromArray(items, 0));
        } else {
          label = this.get("configurationService").getMultiselectValueLabel() + items.length;
        }
      } else {
        //single item is selected
        label = this._getItemLabel(items);
      }
    }
    this.set('selectedValueLabel', label);
  },

  _addOrRemoveFromSelected(item) {
    if (!this.get('multiselect')) {
      //single select combobox does not perform any selected items removal
      this.set('internalSelectedList', [item]);
    } else {
      //if multiselect combobox, first check if object is not already in selected list
      let selectedList = this.get('internalSelectedList');
      if (Ember.isNone(selectedList)) {
        this.set('internalSelectedList', []);
      }

      if (Ember.isPresent(selectedList) && selectedList.find((selectedItem) => this._getItemKey(item) === this._getItemKey(selectedItem))) {
        //remove item from list of selected
        selectedList = selectedList.find((selectedItem) => this._getItemKey(item) !== this._getItemKey(selectedItem));
        if (Ember.isPresent(selectedList) && !Array.isArray(selectedList)) {
          selectedList = [selectedList];
        }
        this.set('internalSelectedList', selectedList);
      } else {
        this.get('internalSelectedList').push(item);
      }
    }
  },

  _selectItem(item) {
    this._addOrRemoveFromSelected(item);
    if (!this.get('multiselect')) {
      this._hideDropdown(true);
    }
  },

  /**
   * register event listeners to handle clicking outside of combobox to close it
   */
  _initDropdownCloseListeners() {
    Ember.run.scheduleOnce('afterRender', this, () => {

      var hideDropdown = (event) => {

        //click on arrow button
        let $combo = Ember.$(this.element);
        if (isElementClicked($combo.find('.dropdown-icon'), event)) {
          this._hideDropdown(false);
          return;
        }

        //click into input
        if (isElementClicked($combo.find('.combo-input'), event)) {
          if (this.get('canFilter')) {
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

            if (Ember.$(event.target).hasClass('do-not-hide-dropdown')) {
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
        Ember.$('body').on(`click.hideDropdown_${this.elementId}`, hideDropdown);
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
    if (Ember.isPresent(this.get('selected'))) {
      //do not automatically select if something is already selected
      return;
    }

    let valueList = this.get('valueList');
    if (Ember.isEmpty(valueList)) {
      return;
    }
    if (valueList.length === 1) {
      //only 1 item in value list
      this._selectItem(getObjectFromArray(valueList, 0));
      return;
    }

    if (this.get('preselectFirst') === true) {
      //preselect item
      this._selectItem(getObjectFromArray(valueList, 0));
      return;
    }
  },

  _destroyDropdownCloseListeners() {
    Ember.$('body').off(`click.hideDropdown_${this.elementId}`);
  },

  actions: {
    actionDropdownButton() {
      if (!this.get('_disabledCombobox')) {
        this._showDropdown();
      }
    },

    actionItemSelect(item) {
      this._selectItem(item);
    }
  }
});
