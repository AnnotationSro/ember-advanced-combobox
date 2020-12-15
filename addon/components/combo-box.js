import {
  debounce,
  next,
  once,
  schedule,
  scheduleOnce
} from '@ember/runloop';
import {
  isHTMLSafe
} from '@ember/string';
import {
  on
} from '@ember/object/evented';
import {
  getOwner
} from '@ember/application';
import {
  computed,
  get,
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
  isEmpty,
  isNone,
  isPresent
} from '@ember/utils';
import layout from '../templates/components/combo-box';
import {
  accentRemovalHelper
} from '../helpers/accent-removal-helper';
import {
  comboItemLabel
} from '../helpers/combo-item-label';
import {
  addObserver,
  removeObserver
} from '@ember/object/observers';
import $ from 'cash-dom';


function scrollTop($element, step) {
  var start = window.pageYOffset;
  var count = 0;
  var intervalRef = setInterval((function(interval, curOffset) {
    return function() {
      $element.on("scroll.stopAnimation", function() {
        $element.off("scroll.stopAnimation");
        clearInterval(intervalRef);
      })
      curOffset -= (interval * step);
      $element[0].scrollTo(0, curOffset);
      count++;
      if (count > 150 || curOffset < 0) {
        $element.off("scroll.stopAnimation");
        clearInterval(intervalRef)
      }
    }
  })(step, start--), 50);
}

function getObjectFromArray(array, index) {
  if (array.objectAt) {
    return array.objectAt(index);
  }
  return array[index];
}

function adjustDropdownMaxHeight($dropdown, $input, maxDropdownHeight) {
  $dropdown = $dropdown.filter(':not(.dropdown-mobile)');
  let oldScrollPosition = $dropdown[0].scrollTop;
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
    } else {
      $dropdown.css({
        'maxHeight': maxDropdownHeight + 'px'
      });
    }
  } else {
    if (dropdownHeight >= dropdownBottom) {
      $dropdown.css({
        'maxHeight': calculateMaxDropdownHeight($dropdown, $input, maxDropdownHeight) + 'px'
      });
    } else {
      $dropdown.css({
        'maxHeight': maxDropdownHeight + 'px'
      });
    }
  }

  scrollTop($dropdown, oldScrollPosition);

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
    'lazyCallbackInProgress:lazy-loading-in-progress',
    'hasEmptySelectionClass:empty-selection'
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
  pagination: false,
  pageSize: 10,
  showDropdownOnClick: true, //automatically show dropdown when clicked anywhere in a combobox
  placeholder: null,
  confirmInputValueOnBlur: false,
  mobileDropdownVisible: false,
  hideSelected: false, //if false, selected value will not be shown
  onDisabledCallback() {},
  canAutoselect: false,
  onDropdownIconClicked() {
    return true;
  },

  //internals
  _page: 1,
  _popper: null,
  lazyCallbackInProgress: false,
  selectedValueLabel: null,
  dropdownVisible: false,
  internalSelectedList: A([]), // eslint-disable-line  ember/avoid-leaking-state-in-ember-objects
  valuePromiseResolving: false,
  isComboFocused: false,
  _hasNextPage: true,
  preselectedDropdownItem: 0, //index of currently preselected item in dropdown (has focus)
  _isKeyboardSupportEnabled: false,
  configurationService: service('adv-combobox-configuration-service'),
  _emberAdvancedComboboxHideDropdownListenerFn: null,
  _temporaryDisableCloseListener: false,
  _temporaryDisableCloseListenerTimer: false,
	_inputFocussed: false,
	_dropdownButtonClicked:false,

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

  hasEmptySelectionClass: computed('isEmptySelectionLabelVisible', 'dropdownVisible', function() {
    if (this.get('dropdownVisible') === true) {
      return false;
    }
    return this.get('isEmptySelectionLabelVisible');
  }),

  init() {

    this._super(...arguments);

    this.initSelectedValues(true);

    this.createSelectedLabel(this.get('internalSelectedList'));

    let noValueLabel = this.get('noValueLabel');
    if (isEmpty(this.get('valueList')) && isPresent(noValueLabel) && noValueLabel.length > 0) {
      this.set('inputValue', noValueLabel);
      this.set('isEmptySelectionLabelVisible', false);
    } else {
      this.set('inputValue', this.get('selectedValueLabel'));
    }

    this._handleLabelOnlyNoValue();


    this.set('_emberAdvancedComboboxHideDropdownListenerFn', this.emberAdvancedComboboxHideDropdownListener.bind(this));
    document.addEventListener('ember-advanced-combobox-hide-dropdown', this.get('_emberAdvancedComboboxHideDropdownListenerFn'));

  },

  inputValueDisplayed: computed('hideSelected', 'inputValue', 'labelOnly', {
    set(key, value) {
      this.set('inputValue', value);
      return value;
    },
    get() {
      if (this.get('hideSelected') === true) {
        return '';
      }
      if (this.get('labelOnly') === true && isEmpty(this.get('internalSelectedList'))) {
        var chooseLabel = isPresent(this.get('chooseLabel')) ? this.get('chooseLabel') : this.get('configurationService').getChooseLabel();
        if (this.get('inputValue') === chooseLabel) {
          return '';
        }
      }
      return this.get('inputValue');
    }
  }),

  // eslint-disable-next-line ember/no-on-calls-in-components
  disabledObserver: on('init', observer('_disabledCombobox', 'labelOnly', function() {
    once(this, 'callOnDisabledCallback');

  })),

  callOnDisabledCallback() {
    let disabledStatus = this.get('_disabledCombobox') || this.get('labelOnly');
    this.get('onDisabledCallback')(disabledStatus);
    let configCallback = this.get('configurationService').getOnDisabledCallback();
    if (typeof configCallback === 'function') {
      configCallback(disabledStatus, this.element);
    }
  },

  initFocusHandler() {
    let $element = $(this.element);
    $element.on('focusin', () => {
      if (this.get('isComboFocused') === true) {
        return;
      }
      if (this.get('isComboFocused') === false) {
        scheduleOnce('afterRender', this, function() {
          $element.find('input').trigger('focus');
        });
      }

      this.set('isComboFocused', true);

      $element.on('focusout', () => {

        if (this._temporaryDisableCloseListener === true) {
          return;
        }

        if (this.get('mobileDropdownVisible') === true) {
          //mobile dropdowns should be closed manually
          return false;
        }

        // let the browser set focus on the newly clicked elem before check
        setTimeout(() => {
          if (!$element.find(':focus').length) {
            if (this.get('multiselect') === true) {
              this._hideDropdown(true, false);
              return;
            }
            if (this.get('confirmInputValueOnBlur') === true && isPresent(this.get('inputValue')) && this.get('inputValue').length > 0) {
              //first select value that is in the inputValue
              let objectToSelect = this._itemKeysListToItemObjects(this.get('inputValue'));
              if (!isEmpty(objectToSelect)) {
                objectToSelect = objectToSelect[0];
              }

              if (isPresent(objectToSelect)) {
                this._addOrRemoveFromSelected(objectToSelect);
                this._callOnSelectedCallback(this.convertItemListToKeyList(this.get('internalSelectedList')), null);
                this.createSelectedLabel(this.get('internalSelectedList'));
                this.set('inputValue', this.get('selectedValueLabel'));

                this._hideDropdown(true, false);
              } else {
                this._hideDropdown(false);
              }

            } else {
              this._hideDropdown(false);
            }
          }
        }, 0);

      })
    });
  },

  destroyFocusHandler() {
    let $element = $(this.element);
    $element.off('focusin');
    $element.off('focusout');
  },

  didInsertElement() {
    this._super(...arguments);

    let $element = $(this.element);
    if (this.get('labelOnly') === false) {
      this.initFocusHandler();
    }

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


    //initInputClickHandler
    $(this.element).find(' *').on('touchstart', (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (this.get('_disabledCombobox') || this.get('labelOnly') === true) {
        return;
      }
      this._showMobileDropdown();
    });

    $(this.element).find('.combo-input').on('click', (event) => {
      //comobobox input was clicked on
      if (this.get('_disabledCombobox') || this.get('labelOnly')) {
        //no clicking on input allowed
        return;
      }

      if (this.get('simpleCombobox') === false) {
        //hide all other dropdowns except this one (if user clicks on the same dropdown even if already visible - keep that one opened)
        this.triggerJsEvent('ember-advanced-combobox-hide-dropdown', {
          elementId: this.elementId
        });

        event.stopPropagation();
      }
    });

    if (this.get('pagination') === true) {
      this.initPagination();
    }
    return false;
  },

  triggerJsEvent(eventName, data) {
    let event;
    try {

      // For modern browsers except IE:
      event = new CustomEvent(eventName, {
        detail: data
      });

    } catch (err) {

      // If IE 11 (or 10 or 9...?) do it this way:

      // Create the event.
      event = document.createEvent('Event');
      // Define that the event name is 'build'.
      event.initEvent(eventName, true, true);
      event.detail = data;

    }
    // Dispatch/Trigger/Fire the event
    document.dispatchEvent(event);
  },

  willDestroyElement() {
    this._super(...arguments);

    this._destroyDropdownCloseListeners();
    this.destroyFocusHandler();

    let popper = this.get('_popper');
    if (isPresent(popper)) {
      popper.destroy();
    }
    if (this.get('_isTesting') === false && isPresent(this.get('_erd'))) {
      this.get('_erd').uninstall($(this.element).find('.dropdown')[0]);
    }
    $(this.element).find('.dropdown').off('scroll.pagination');
    $(this.element).find('.combobox-mobile-dialog .dropdown').off('touchmove.mobilePagination');
    document.removeEventListener('ember-advanced-combobox-hide-dropdown', this.get('_emberAdvancedComboboxHideDropdownListenerFn'));
    this.set('_emberAdvancedComboboxHideDropdownListenerFn', null);
  },

  emberAdvancedComboboxHideDropdownListener(event) {
    let doNotHideComboboxId = isPresent(event.detail) ? event.detail.elementId : null;
    if (this.get('dropdownVisible') === true && (isPresent(doNotHideComboboxId) && this.elementId !== doNotHideComboboxId)) {
      this._hideDropdown(false);
    }
  },

  initKeyboardSupport() {
    this.set('_isKeyboardSupportEnabled', true);

    this.set('preselectedDropdownItem', 0);

    let keyboardCallback = (event) => {
      //from MSDN documentation
      // Internet Explorer, Edge (16 and earlier), and Firefox (36 and earlier)
      //use "Left", "Right", "Up", and "Down" instead of "ArrowLeft", "ArrowRight", "ArrowUp", and "ArrowDown".
      switch (event.key) {
        case 'ArrowUp':
        case 'Up':
          this.keyboardSelect(-1);

          event.preventDefault();
          event.stopPropagation();

          break;
        case 'ArrowDown':
        case 'Down':
          this.keyboardSelect(1);

          event.preventDefault();
          event.stopPropagation();

          break;
        case 'Enter': {
          if (this.get('multiselect') === true) {
            break;
          }
          let selectedItem = getObjectFromArray(this.get('filteredValueList'), this.get('preselectedDropdownItem'));

          this._addOrRemoveFromSelected(selectedItem);

          this._hideDropdown(true, false);
          $(this.element).find('*').blur();

          event.preventDefault();
          break;
        }
      }
    }

    this.set('_keyboardCallback', keyboardCallback);

    document.getElementsByTagName('body')[0].addEventListener('keydown', this.get('_keyboardCallback'));

    addObserver(this, 'filteredValueList.[]', this, this.keyboardSupportValueListChanged);
    this.keyboardSupportValueListChanged();
  },

  keyboardSupportValueListChanged() {
    $(this.element).find('.dropdown .dropdown-item').off('mouseover.keyboard-item');

    scheduleOnce('afterRender', this, function() {
      next(this, () => {
        let $items = $(this.element).find('.dropdown .dropdown-item');
        $items.on('mouseover.keyboard-item', (e) => {
          let selectedItem = $items.index(e.target);
          this.set('preselectedDropdownItem', selectedItem);
        });
      });
    });
  },

  destroyKeyboardSupport() {
    if (this.get('_isKeyboardSupportEnabled') === false) {
      return;
    }

    $('body').off('keydown.keyboard-support');
    document.getElementsByTagName('body')[0].removeEventListener('keydown', this.get('_keyboardCallback'));
    removeObserver(this, 'filteredValueList.[]', this, this.keyboardSupportValueListChanged);
    $(this.element).find('.dropdown .dropdown-item').off('mouseover.keyboard-item');
    this.set('_isKeyboardSupportEnabled', false);
  },

  keyboardSelect(delta) {
    let preselectedDropdownItem = this.get('preselectedDropdownItem');
    preselectedDropdownItem += delta;
    let moveDown = delta > 0;
    if (preselectedDropdownItem < 0) {
      preselectedDropdownItem = 0;
      // moveDown = !moveDown;
    }
    if (preselectedDropdownItem > this.get('valueList.length') - 1) {
      preselectedDropdownItem = this.get('valueList.length') - 1;
      // moveDown = !moveDown;
    }

    this.set('preselectedDropdownItem', preselectedDropdownItem);
    this.checkDropdownItemVisible(preselectedDropdownItem, moveDown);
  },

  checkDropdownItemVisible(itemIndex, moveDown) {
    let $dropdown = $(this.element).find('.dropdown');
    let $item = $($dropdown.find('.dropdown-item')[itemIndex]);

    if ($item.length === 0) {
      return;
    }

    adjustItemVisible();

    function adjustItemVisible() {
      if (moveDown === true) {
        //move down
        if ($dropdown.height() < $item.position().top + $item.height()) {
          var scrollTop = (itemIndex - (Math.floor($dropdown.height() / $item.height())) + 1) * $item.height();
          scrollTop($dropdown, scrollTop);
        }
      }
      if (moveDown === false) {
        //move up
        if ($item.position().top - $item.height() * 2 < $item.height()) {
          scrollTop($dropdown, itemIndex * $item.height());
        }
      }
    }
  },

  initPagination() {
    let that = this;
    let scrollEnabled = true;
    setTimeout(() => {
      $(this.element).find('.dropdown').on('scroll.pagination', function() {
        if (scrollEnabled === false) {
          //this is to prevent infinite loop when new items are fetched for the next page and dropdown is adjusting its position
          // return;
        }

        if ($(this)[0].scrollTop + $(this).innerHeight() >= $(this)[0].scrollHeight && that.get('lazyCallbackInProgress') === false) {
          scrollEnabled = false;
          that.fetchNextPage(() => {
            scrollEnabled = true;
          });

        }
      });
    }, 100);

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

  tabbable: computed('labelOnly', '_disabledCombobox', 'isComboFocused', function() {
    if (this.get('labelOnly') || this.get('_disabledCombobox')) {
      return false;
    }
    if (this.get('isComboFocused') === true) {
      return false;
    }
    return true;
  }),

  initSelectedValues(canAutoselect) {
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
    if (this.canAutoselect && canAutoselect === true && (this.get('disabled') === false && this.get('labelOnly') === false)) {

      this._automaticallySelect();
    }
  },

  labelOnlyObserver: observer('labelOnly', function() {
    let selectedItems = this.get('internalSelectedList');
    if (this.get('labelOnly')) {
      this._handleLabelOnlyNoValue();
      this.destroyFocusHandler();
    } else {
      this.initFocusHandler();
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
    return A(items);
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
      this.set('internalSelectedList', A([]));
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
    if (this.get('valuePromise')) {
      this.set('valuePromiseResolving', true);
      if (this.get('dropdownVisible') === false) {
        this._changeDropdownPosition();
      }

      this.get('valuePromise').then((result) => {

        this.set('valuePromiseResolving', false);

        let newValueList = (typeof result.data !== 'undefined') ? result.data : result;
        let hasNextPage = result.hasNextPage;
        this.set('_hasNextPage', hasNextPage);

        if (isEmpty(this.get('valueList'))) {
          this.set('valueList', newValueList);
        } else {
          if (this.get('pagination') === true) {
            this.set('valueList', this.get('valueList').concat(newValueList));
          } else {
            this.set('valueList', newValueList);
          }
        }

        this.notifyPropertyChange('sortedValueList');

      });
    }
  })),


  valueListObserver: observer('valueList.[]', function() {
    if (this.get('simpleCombobox') === true) {
      return;
    }
    if (isNone(this.get('lazyCallback')) && isEmpty(this.get('valueList')) && isPresent(this.get('noValueLabel'))) {
      this.set('inputValue', this.get('noValueLabel'));
      return;
    }
    let canAutoselect = isNone(this.get('lazyCallback'));
    this.initSelectedValues(canAutoselect);

    if (isNone(this.get('valueList'))) {
      let noValueLabel = this.get('noValueLabel');
      if (isPresent(noValueLabel) && isNone(this.get('lazyCallback'))) {
        this.set('inputValue', noValueLabel);
      }
      return;
    }
    if ((isEmpty(this.get('internalSelectedList')) && isEmpty(this.get('selected'))) && (!this.get('dropdownVisible') && !this.get('mobileDropdownVisible')) && isNone(this.get('lazyCallback'))) {
      let chooseLabel = isPresent(this.get('chooseLabel')) ? this.get('chooseLabel') : this.get('configurationService').getChooseLabel();
      if (this.get('showChooseLabel') === false) {
        chooseLabel = null;
      }
      this.set('inputValue', chooseLabel);
    } else {
      if (isNone(this.get('lazyCallback'))) {
        let selectedKeys = this._itemKeysListToItemObjects(this.get('selected'));
        if (isEmpty(selectedKeys) && isPresent(this.get('selected'))) {
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

  isInputEditable: computed('canFilter', 'lazyCallback', function() {
    return this.get('canFilter') === true || isPresent(this.get('lazyCallback'));

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
  comboFocusedObserver: observer('isComboFocused', function() {
    if (this.get('_disabledCombobox') === true || this.get('labelOnly') === true) {
      return;
    }

    if (this.isComboFocused === true){
		this.set('_dropdownButtonClicked', false); //reset to default value
	}

    if (this.get('showDropdownOnClick') === true) {
      if (this.get('isComboFocused') === true) {
        //may be called twice - when user click into combobox - dropdown will be shown for the 1st time
        //and then 2nd time when it receives focus afterwards, but that does not matter
        if (this.get('configurationService.isTouchDevice') === true) {
          this._showMobileDropdown();
        } else {
          this._showDropdown();
        }
      }

    } else {
      if (this.get('isInputEditable') === true) {
        if (isNone(this.get('_oldInputValue'))) {
          this.set('_oldInputValue', this.get('inputValue'));
        }

        if (this.isComboFocused === true && isEmpty(this.get('internalSelectedList')) && this._dropdownButtonClicked === false) {
          //there is no selection and perhaps placeholder is shown - so we must clear the placeholder
          this.set('inputValue', '');
        }
        this._initDropdownCloseListeners();
      }
    }

  }),

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
      return A([]);
    }
    if (object.map) {
      //it is an array
      if (object.objectAt) {
        //it is an Ember MutableArray
        return object;
      } else {
        //it is a plain JS array
        return A(object);
      }
    } else {
      return A([object]);
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

  _resetLazyCombobox() {
    this.set('valueList', null);
    this.set('_page', 1);
    this.set('_hasNextPage', 1);
  },

  _showDropdown() {
    if (this.get('dropdownVisible') || this.get('_disabledCombobox') === true) {
      //dropdown is already visible
      return;
    }
    if (isNone(this.get('_oldInputValue'))) {
      this.set('_oldInputValue', this.get('inputValue'));
    }
    if (this.get('isInputEditable') === true && this.get('lazyCallbackInProgress') === false) {
      this.set('inputValue', '');
    }
    if (isPresent(this.get('lazyCallback')) && this.get('lazyCallbackInProgress') === false) {
      this._resetLazyCombobox();
    }

    this.set('dropdownVisible', true);

    //setDropdownWidth
    let $element = $(this.element);
    $element.find('.dropdown').css('min-width', $element.css('width'));

    this.get('onDropdownShow')();

    let oldKeys = this.get('selected');
    if (isEmpty(oldKeys) && isPresent(this.get('internalSelectedList'))) {
      oldKeys = this.get('internalSelectedList').map((sel) => this._getItemKey(sel));
    }

    this.set('oldInternalSelectionKeys', this._createArray(oldKeys));


    if (isPresent(this.get('lazyCallback')) && isEmpty(this.get('valueList')) && this.get('lazyCallbackInProgress') === false) {
      this.setLazyDebounce('', true);
    }

    this._initDropdownCloseListeners();

    this._initPopper();

    if (this.get('mobileDropdownVisible') === false) {
      let $element = $(this.element);
      let $dropdown = $element.find('.dropdown');
      let $input = $element.find('.combo-input');
      adjustDropdownMaxHeight($dropdown, $input, this.get('maxDropdownHeight'));
    }

    this.initKeyboardSupport();

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
    this.setProperties({
      'mobileDropdownVisible': true,
      '_oldInputValue': this.get('inputValue')
    });
    if (isPresent(this.get('lazyCallback')) && this.get('lazyCallbackInProgress') === false) {
      this._resetLazyCombobox();
    }

    $('body').addClass('ember-advanced-combobox-modal-active ');


    schedule('afterRender', this, function() {

      const $mobileDropdown = $(this.element).find('.combobox-mobile-dialog .dropdown');
      const $scrollIndicatorTop = $(this.element).find('.combobox-mobile-dialog .scroll-indicator.scroll-indicator-top');
      const $scrollIndicatorBottom = $(this.element).find('.combobox-mobile-dialog .scroll-indicator.scroll-indicator-bottom');

      let debounce_timer;

      $mobileDropdown.on('scroll', () => {

        if (debounce_timer) {
          window.clearTimeout(debounce_timer);
        }

        debounce_timer = window.setTimeout(function() {
          showScrollIndicator();
        }, 100);

      });

      $mobileDropdown.find('.combobox-mobile-dialog .dropdown').on('touchmove.mobilePagination', () => {
        debounce(this, debouncedFunc, 200);
      });

      showScrollIndicator();

      function showScrollIndicator() {
        if (Math.round($mobileDropdown[0].scrollHeight - $mobileDropdown[0].scrollTop) == Math.round($mobileDropdown.outerHeight())) {
          $scrollIndicatorBottom.removeClass("overflow-scroll-bottom");
        } else {
          $scrollIndicatorBottom.addClass("overflow-scroll-bottom");
        }

        if (Math.round($mobileDropdown[0].scrollHeight - $mobileDropdown[0].scrollTop) == Math.round($mobileDropdown[0].scrollHeight)) {
          $scrollIndicatorTop.removeClass("overflow-scroll-top");
        } else {
          $scrollIndicatorTop.addClass("overflow-scroll-top");
        }
      }

      function debouncedFunc() {
        let $dialogDropdown = $('.combobox-mobile-dialog .dropdown');
        if ($dialogDropdown.length === 0) {
          return;
        }
        if ($dialogDropdown[0].scrollTop + $dialogDropdown.innerHeight() >= $dialogDropdown[0].scrollHeight - 200 && this.get('lazyCallbackInProgress') === false) {
          this.fetchNextPage(() => {});
        }
      }
    });

    this.get('onDropdownShow')();

    this.set('oldInternalSelectionKeys', this._createArray(this.get('selected')));
    if (this.get('canFilter')) {
      // if (isNone('lazyCallback')) {
      //when we are using layzCallback, do not clear inputValue, otherwise clear it
      this.set('inputValue', '');
      // }
    } else {
      if (isNone(this.get('lazyCallback'))) {
        let chooseLabel = isPresent(this.get('chooseLabel')) ? this.get('chooseLabel') : this.get('configurationService').getChooseLabel();
        if (this.get('showChooseLabel') === false) {
          chooseLabel = null;
        }
        this.set('inputValue', chooseLabel);

      } else {
        let promise = this.get('lazyCallback')("", this.get('_page'), this.get('pageSize'));
        this.setProperties({
          'valuePromise': promise,
          'inputValue': ''
        });
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

    if (this.get('disabled') || this.get('labelOnly') === true) {
      return;
    }

    if ((this.get('isDestroyed') || this.get('isDestroying'))) {
      return;
    }

    $('body').removeClass('ember-advanced-combobox-modal-active ');
    $('.ember-modal-overlay').off('touchmove');

    let $element = $(this.element);
    $element.off('focusout');
    $('.combobox-mobile-dialog .dropdown').off('touchmove.mobilePagination');

    if (this.get('isComboFocused') === false && this.get('mobileDropdownVisible') === false) {
      return;
    }
    this.set('isComboFocused', false);
    this.cancelLazyDebounce();

    $element.find('.dropdown').css({
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
      this.createSelectedLabel(this.get('internalSelectedList'));
      this.set('inputValue', this.get('selectedValueLabel'));
    } else {
      //selection is not accepted -> revert internal selection
      this.set('internalSelectedList', this._itemKeysListToItemObjects(this.get('oldInternalSelectionKeys')));
		this.createSelectedLabel(this.get('internalSelectedList'));
		this.set('inputValue', this.get('selectedValueLabel'));
    }

    // let noValueLabel = this.get('noValueLabel');

    if (resetInput) {
      this.set('inputValue', this.get('_oldInputValue'));
    }
    this.set('_oldInputValue', null);
    this.set('_page', 1);

    this._destroyDropdownCloseListeners();
    this.destroyKeyboardSupport();
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
    let isEmptySelectionLabelVisible = false;
    if (isEmpty(items)) {
      //no items were selected
      if (isPresent(this.get('selected')) && isPresent(this.get('noValueLabel'))) {
        label = this.get('noValueLabel');
      } else {
        if (this.get('showEmptySelectionLabel') === true || this.get('simpleCombobox') === true) {
          label = (isPresent(this.get('emptySelectionLabel')) || this.get('emptySelectionLabel') === '') ? this.get('emptySelectionLabel') : this.get("configurationService").getEmptySelectionLabel();
          isEmptySelectionLabelVisible = true;
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
    this.set('isEmptySelectionLabelVisible', isEmptySelectionLabelVisible)
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
        this.set('internalSelectedList', A([]));
      } else {
        this._addOrRemoveFromList(this.get('internalSelectedList'), item);
      }
    }
  },

  _selectItem(item) {
    this._addOrRemoveFromSelected(item);
    if (!this.get('multiselect')) {
      this._hideDropdown(true, false);
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
          if (this._temporaryDisableCloseListener === true) {
            // this.set('_temporaryDisableCloseListener', false);
            return;
          }
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
          if (this.get('isComboFocused')) {

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

      if (this.get('isComboFocused')) {
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
        selectFirstItem.bind(this)();
      });
      return;
    }

    if (this.get('preselectFirst') === true) {
      //preselect item
      next(this, function() {
        selectFirstItem.bind(this)();
      });
      return;
    }

    function selectFirstItem() {
      this._selectItem(getObjectFromArray(valueList, 0));
      this._callOnSelectedCallback(this.convertItemListToKeyList(this.get('internalSelectedList')), null);
      this.createSelectedLabel(this.get('internalSelectedList'));
      this.set('inputValue', this.get('selectedValueLabel'));
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
    this.set('lazyCallbackInProgress', false);
  },

  setLazyDebounce(inputValue, runImmidiate = false, clearOldValueList = true, onFetchDone) {
    this.cancelLazyDebounce();

    let chooseLabel = isPresent(this.get('chooseLabel')) ? this.get('chooseLabel') : this.get('configurationService').getChooseLabel();

    if (this.get('showChooseLabel') === true && inputValue === chooseLabel) {
      inputValue = '';
    }

    let debounceTime = this.get('configurationService').getLazyDebounceTime();
    if (runImmidiate === true) {
      debounceTime = 0;
    }
    if (debounceTime > 0) {
      this.set('lazyCallbackInProgress', true);
      this.set('valuePromiseResolving', true);
    }

    let debounceTimer = setTimeout(() => {
      let promise;
      if (this.get('pagination') === true) {
        if (this.get('mobileDropdownVisible') === true && isEmpty(inputValue) === true) {
          this.incrementProperty('_page');
        }
        promise = this.get('lazyCallback')(inputValue, this.get('_page'), this.get('pageSize'));
      } else {
        promise = this.get('lazyCallback')(inputValue);
      }
      if (clearOldValueList === true) {
        this.set('valueList', null);
      }
      this.set('valuePromise', promise);
      promise.then(() => {
        if (typeof onFetchDone === 'function') {
          onFetchDone();
        }
        this.incrementProperty('_page');
        scheduleOnce('afterRender', this, () => {
          if (this.get('mobileDropdownVisible') === false) {
            this._showDropdown();
          }
          if (this.get('simpleCombobox') === true && isNone(this.get('lazyCallback'))) {
            this.set('inputValue', '');
          }
          this.set('lazyCallbackInProgress', false);
        });
      });


    }, debounceTime);

    this.set('lazyDebounce', debounceTimer);
  },

  fetchNextPage(onFetchDone) {
    if (this.get('_hasNextPage') === true) {
      this.setLazyDebounce(this.get('inputValue'), false, false, onFetchDone);
    }
  },

  actions: {

    inputValueChanged(input, event) {
      if (this.get('mobileDropdownVisible') === false && event.key.length > 1) {
        //some non printable character was pressed - ignore it, otherwise lazyCallback may be triggered
        return;
      }

      this.set('_page', 1);

      let lazyCallback = this.get('lazyCallback');
      let inputValue = this.get('inputValue');
      if (isPresent(lazyCallback)) {

        if (inputValue.length < this.getMinLazyCharacters() && inputValue.length > 0) {
          this.cancelLazyDebounce();
        } else {
          if (inputValue.length === 0) {
            this._resetLazyCombobox();
          }

          this.setLazyDebounce(inputValue, false, true);
        }
      }
    },

    actionDropdownButton() {
      if (this.get('_disabledCombobox')) {
        return;
      }
      this.set('_dropdownButtonClicked', true);

      let canOpenDropdown = this.onDropdownIconClicked();
      if (canOpenDropdown === false) {
        return;
      }
      this.set('_temporaryDisableCloseListener', true);
      this.set('_temporaryDisableCloseListenerTimer', setTimeout(() => {
        this.set('_temporaryDisableCloseListener', false);
      }, 300))

      if (this.get('dropdownVisible') === false) {
        if (isPresent(this.get('lazyCallback'))) {
          // this.setLazyDebounce('', true);
          this.set('valueList', []);
          this._showDropdown();
          return;
        }
        this.triggerJsEvent('ember-advanced-combobox-hide-dropdown');
        // this._showDropdown();
      }
    },

    actionItemSelect(item) {
      this._selectItem(item);
    },

    actionCancelMobile() {
      this._hideDropdown(false);
    },

    actionAcceptMobile() {
      this._hideDropdown(true);
    }
  }
});
