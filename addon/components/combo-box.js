import Ember from 'ember';
import layout from '../templates/components/combo-box';
import {accentRemovalHelper} from '../helpers/accent-removal-helper';
import {comboItemLabel} from '../helpers/combo-item-label';

function getObjectFromArray(array, index) {
	if (array.objectAt) {
		return array.objectAt(index);
	}
	return array[index];
}

function adjustDropdownMaxHeight($dropdown, $input) {
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
				'maxHeight': calculateMaxDropdownHeight($dropdown, $input) + 'px'
			});
		}
	} else {
		if (dropdownHeight >= dropdownBottom) {
			$dropdown.css({
				'maxHeight': calculateMaxDropdownHeight($dropdown, $input) + 'px'
			});
		}
	}

	function calculateMaxDropdownHeight($dropdown, $input) {
		let inputBottom = $input[0].getBoundingClientRect().bottom;
		let inputTop = $input[0].getBoundingClientRect().top;

		return Math.max(
			window.innerHeight - inputBottom, //dropdown below the input
			inputTop //dropdown above the input
		) - 10;
	}
}

export default Ember.Component.extend({
	classNames: ['advanced-combo-box'],
	classNameBindings: ['labelOnly:combobox-label-only', '_disabledCombobox:combobox-disabled', 'dropdownVisible:dropdown-visible:dropdown-hidden', 'isComboFocused:combo-focused'],
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
	showDropdownButton: true,
	disabledWhenEmpty: true,
	showLabelWhenDisabled: true,
	showChooseLabel: true,
	showEmptySelectionLabel: true,
	simpleCombobox: false,


	//internals
	_popper: null,
	lazyCallbackInProgress: false,
	selectedValueLabel: null,
	dropdownVisible: false,
	internalSelectedList: new Ember.A([]),
	valuePromiseResolving: false,
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

	_isTesting: Ember.computed(function() {
		let config = Ember.getOwner(this).resolveRegistration('config:environment');
		return config.environment === 'test';
	}),

	initCombobox: Ember.on('init', function() {

		this.initSelectedValues();

		this.createSelectedLabel(this.get('internalSelectedList'));

		let noValueLabel = this.get('noValueLabel');
		if (Ember.isEmpty(this.get('valueList')) && Ember.isPresent(noValueLabel) && noValueLabel.length > 0) {
			this.set('inputValue', noValueLabel);
		} else {
			this.set('inputValue', this.get('selectedValueLabel'));
		}

		this._handleLabelOnlyNoValue();

	}),

	setDropdownWidth: Ember.on('didInsertElement', function() {
		let $element = Ember.$(this.element);
		$element.find('.dropdown').css('min-width', $element.css('width'));
	}),

	initElement: Ember.on('didInsertElement', function() {
		let $element = Ember.$(this.element);
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
			erd.listenTo(Ember.$(this.element).find('.dropdown')[0], onResizeCallback);
			this.set('_erd', erd);
		}
	}),

	onDestroy: Ember.on('willDestroyElement', function() {
		// Ember.$(window).off(`scroll.combobox-scroll-${this.elementId}`);
		this._destroyDropdownCloseListeners();

		let popper = this.get('_popper');
		if (Ember.isPresent(popper)) {
			popper.destroy();
		}
		if (this.get('_isTesting') === false) {
			this.get('_erd').uninstall(Ember.$(this.element).find('.dropdown')[0]);
		}
	}),

	//if 'itemLabelForSelectedPreview' is defined, 'itemLabelForSelectedPreview' is used, otherwise 'itemLabel' is used
	internalItemLabelForSelectedPreview: Ember.computed('itemLabelForSelectedPreview', 'itemLabel', function() {
		return this.get('itemLabelForSelectedPreview') || this.get('itemLabel');
	}),

	disabledComboboxObserver: Ember.on('init', Ember.observer('_disabledCombobox', 'showLabelWhenDisabled', function() {
		if (this.get('lazyCallbackInProgress') === true){
			return;
		}
		if (this.get('_disabledCombobox') === true && this.get('showLabelWhenDisabled') === false) {
			this.set('inputValue', '');
		} else {
			this.set('inputValue', this.get('selectedValueLabel'));
		}
	})),

	tabbable: Ember.computed('labelOnly', '_disabledCombobox', function() {
		return this.get('labelOnly') || this.get('_disabledCombobox');
	}),

	initSelectedValues() {
		//find selected items and assgn them into internalSelectedList
		let selected = this.get('selected');

		if (Ember.isPresent(selected)) {
			let itemsArray = this._itemKeysListToItemObjects(selected);
			this.set('internalSelectedList', itemsArray);
			this.createSelectedLabel(itemsArray);
			if (!this.get('dropdownVisible') && Ember.isNone(this.get('lazyCallback'))) {
				this.set('inputValue', this.get('selectedValueLabel'));
			}
		} else {
			this.set('internalSelectedList', Ember.A([]));
		}

		this._automaticallySelect();
	},

	labelOnlyObserver: Ember.observer('labelOnly', function() {
		let selectedItems = this.get('internalSelectedList');
		if (this.get('labelOnly')) {
			this._handleLabelOnlyNoValue();
		} else {
			let noValueLabel = this.get('noValueLabel');
			if (Ember.isEmpty(this.get('valueList')) && Ember.isPresent(noValueLabel) && noValueLabel.length > 0) {
				this.set('inputValue', noValueLabel);
			} else {
				this.createSelectedLabel(selectedItems);
				this.set('inputValue', this.get('selectedValueLabel'));
			}
		}
	}),


	inputValueObserver: Ember.observer('inputValue', function() {
		if (Ember.isPresent(this.get('lazyCallback')) && this.get('simpleCombobox') === false) {
			this._hideDropdown(false, false);
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
			if (Ember.String.isHTMLSafe(filterQuery)) {
				filterQuery = filterQuery.toString();
			}
			filterQuery = accentRemovalHelper(String(filterQuery).toLowerCase());

			//filter the list
			let filteredValueList = valueList.filter((value) => {
				let valueLabel = this._getItemLabel(value);
				if (Ember.String.isHTMLSafe(valueLabel)) {
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
			if (Ember.isEmpty(this.get('internalSelectedList'))) {
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
		return new Ember.A(items);
	},

	findItemByKey(key) {
		let items = this.get('valueList');
		if (Ember.isNone(items)) {
			if (Ember.isPresent(this.get('lazyCallback')) && this.get('selected') === key) {
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
		if (Ember.isEmpty(this.get('valueList'))) {
			return 0;
		}

		let itemsLength = this.get('valueList').length;
		if (typeof itemsLength !== 'number') {
			//it looks like valueList.length is a computedProperty
			itemsLength = this.get('valueList.length');
		}
		return itemsLength;
	},

	selectedObserver: Ember.observer('selected', function() {
		let selected = this.get('selected');
		if (Ember.isEmpty(selected)) {
			this.set('internalSelectedList', new Ember.A([]));
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

	valuePromiseObserver: Ember.on('init', Ember.observer('valuePromise', function() {
		if (Ember.isPresent(this.get('valuePromise')) && Ember.isEmpty(this.get('valueList'))) {
			this.set('valuePromiseResolving', true);
			this._changeDropdownPosition();

			this.get('valuePromise').then((result) => {
				this.set('valuePromiseResolving', false);
				this.set('valueList', result);
			});
		}
	})),


	valueListObserver: Ember.observer('valueList.[]', function() {
		if (this.get('simpleCombobox') === true){
			return;
		}
		this.initSelectedValues();
		if (Ember.isEmpty(this.get('internalSelectedList')) && !this.get('dropdownVisible') && Ember.isNone(this.get('lazyCallback'))) {
			let chooseLabel = this.get('configurationService').getChooseLabel();
			if (this.get('showChooseLabel') === false) {
				chooseLabel = null;
			}
			this.set('inputValue', chooseLabel);
		}else{
			this.set('inputValue', '');
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
			if (Ember.isEmpty(newList)) {
				this.get('onSelected')(null);
			} else {
				this.get('onSelected')(getObjectFromArray(newList, 0));
			}
		}
	},

	_disabledCombobox: Ember.computed('disabled', 'valueList.[]', 'labelOnly', 'noValueLabel', 'lazyCallback', function() {
		if (this.get('disabled')) {
			return true;
		}

		if (this.get('labelOnly') || Ember.isPresent(this.get('lazyCallback'))) {
			return false;
		}

		if (Ember.isEmpty(this.get('valueList')) && this.get('disabledWhenEmpty') === true) {
			//if there is no valueList, but 'noValueLabel' is specified, then combobox is not in disabled state - it should show 'noValueLabel' instead
			if (Ember.isPresent(this.get('noValueLabel'))) {
				return false;
			}

			return true;
		}

		return false;
	}),

	//we cannot use {{input readonly=readonly}} because of bug https://github.com/emberjs/ember.js/issues/11828
	inputNotClickableObserver: Ember.on('init', Ember.observer('_disabledCombobox', 'labelOnly', 'valueList.[]', 'canFilter', 'lazyCallback', function() {
		let notClickable = false;
		if (this.get('_disabledCombobox')) {
			notClickable = true;
		}
		if (this.get('labelOnly')) {
			notClickable = true;
		}
		if (Ember.isEmpty(this.get('valueList')) && Ember.isNone(this.get('lazyCallback'))) {
			notClickable = true;
		}
		if (this.get('canFilter') === false && Ember.isNone(this.get('lazyCallback'))) {
			notClickable = true;
		}

		Ember.run.scheduleOnce('afterRender', this, function() {
			Ember.$(this.element).find('.combo-input').prop('readonly', notClickable);
		});

	})),

	initInputClickHandler: Ember.on('didInsertElement', function() {

		Ember.$(this.element).find(' *').on('touchstart', (event) => {
			event.stopPropagation();
			if (this.get('_disabledCombobox')) {
				return;
			}
			this._showMobileDropdown();
		});

		Ember.$(this.element).find('.combo-input').on('click', () => {
			//comobobox input was clicked on
			if (this.get('_disabledCombobox') || this.get('labelOnly')) {
				//no clicking on input allowed
				return;
			}

			if (this.get('simpleCombobox') === false) {
				this._showDropdown();
			}
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

	asyncLoaderStartLabel: Ember.computed(function() {
		return this.get('configurationService').getAsyncLoaderStartLabel();
	}),

	emptyValueListLabel: Ember.computed(function() {
		return this.get('configurationService').getEmptyValueListLabel();
	}),

	mobileFilterPlaceholder: Ember.computed(function() {
		return this.get('configurationService').getMobileFilterPlaceholder();
	}),

	mobileOkButton: Ember.computed(function() {
		return this.get('configurationService').getMobileOkButton();
	}),

	mobileCancelButton: Ember.computed(function() {
		return this.get('configurationService').getMobileCancelButton();
	}),

	/**
	 * creates Ember's MutableArray from either single object or array (array may be a plain JS array or Ember MutableArray)
	 */
	_createArray(object) {
		if (Ember.isNone(object)) {
			return new Ember.A([]);
		}
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
		if (Ember.isNone(item)) {
			return null;
		}
		if (Ember.isPresent(this.get('itemKey'))) {
			return Ember.get(item, this.get('itemKey'));
		} else {
			//if no itemKey is specified, use the item object itself
			return item;
		}
	},

	_getItemLabel(item) {
		if (Ember.isPresent(this.get('itemLabel'))) {
			return comboItemLabel([item, this.get('itemLabel')]);
		} else {
			//if no itemLabel is specified, use the item object itself
			return item;
		}
	},

	_getPropertyFromItem(item, property) {
		if (Ember.isPresent(property) && Ember.isPresent(item)) {
			return Ember.get(item, property);
		} else {
			return item;
		}
	},

	_showDropdown() {
		if (this.get('dropdownVisible')) {
			//dropdown is already visible
			return;
		}

		if (Ember.isPresent(this.get('lazyCallback'))) {
			let minLazyCharacters = this.get('configurationService').getMinLazyCharacters();
			//if combobox is lazy and there are not enough characters - do not show the dropdown
			if (Ember.isPresent(this.get('inputValue')) && this.get('inputValue').length < minLazyCharacters) {
				return;
			}
		}

		this.set('dropdownVisible', true);

		this.get('onDropdownShow')();

		let oldKeys = this.get('selected');
		if (Ember.isEmpty(oldKeys) && Ember.isPresent(this.get('internalSelectedList'))) {
			oldKeys = this.get('internalSelectedList').map((sel) => this._getItemKey(sel));
		}

		this.set('oldInternalSelectionKeys', this._createArray(oldKeys));
		if (this.get('canFilter')) {
			if (Ember.isNone(this.get('lazyCallback'))) {
				//when we are using lazyCallback, do not clear inputValue, otherwise clear it
				this.set('inputValue', '');
			}
		} else {
			if (Ember.isNone(this.get('lazyCallback'))) {

				let chooseLabel = this.get('configurationService').getChooseLabel();
				if (this.get('showChooseLabel') === false) {
					chooseLabel = null;
				}
				this.set('inputValue', chooseLabel);
			}
		}

		this._initDropdownCloseListeners();

		this._initPopper();

		let $element = Ember.$(this.element);
		let $dropdown = $element.find('.dropdown');
		let $input = $element.find('.combo-input');
		adjustDropdownMaxHeight($dropdown, $input);
	},

	_initPopper() {
		if (Ember.isPresent(this.get('_popper'))) {
			let popperOld = this.get('_popper');
			popperOld.destroy();
		}
		if (this.get('dropdownVisible') === false) {
			return;
		}

		let $element = Ember.$(this.element);
		let $dropdown = $element.find('.dropdown');
		let $input = $element.find('.input-group');

		let popper = new window.Popper($input[0], $dropdown[0], {
			placement: 'bottom-start',
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
			if (Ember.isNone('lazyCallback')) {
				//when we are using layzCallback, do not clear inputValue, otherwise clear it
				this.set('inputValue', '');
			}
		} else {
			if (Ember.isNone('lazyCallback')) {

				let chooseLabel = this.get('configurationService').getChooseLabel();
				if (this.get('showChooseLabel') === false) {
					chooseLabel = null;
				}
				this.set('inputValue', chooseLabel);
			}
		}
	},

	_changeDropdownPosition() {
		Ember.run.scheduleOnce('afterRender', this, function() {
			let $element = Ember.$(this.element);
			let $dropdown = $element.find('.dropdown');
			let $input = $element.find('.combo-input');
			adjustDropdownMaxHeight($dropdown, $input);
		});
	},

	_hideDropdown(acceptSelected, resetInput = true) {

		Ember.$(this.element).find('.dropdown').css({
			'maxHeight': ''
		});

		this.get('onDropdownHide')();

		// Ember.$(window).off(`scroll.combobox-scroll-${this.elementId}`);
		this.set('dropdownVisible', false);
		this.set('mobileDropdownVisible', false);

		Ember.run.scheduleOnce('afterRender', this, () => {

			let popper = this.get('_popper');
			if (Ember.isPresent(popper)) {
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
			if (Ember.isEmpty(this.get('internalSelectedList')) &&
				Ember.isPresent(noValueLabel) &&
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
		if (Ember.isNone(list1) && Ember.isNone(list2)) {
			//both of them are null/undefined
			return true;
		}
		if (Ember.isNone(list1) || Ember.isNone(list2)) {
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
		if (Ember.isEmpty(itemList)) {
			return null;
		}
		return itemList.map((item) => this._getItemKey(item));
	},

	createSelectedLabel(items) {
		let label = null;
		if (Ember.isEmpty(items)) {
			//no items were selected
			if (this.get('showEmptySelectionLabel') === true){
				label = this.get("configurationService").getEmptySelectionLabel();
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
			if (Ember.isNone(selectedList)) {
				this.set('internalSelectedList', new Ember.A([]));
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
					if (this.get('canFilter') || Ember.isPresent(this.get('lazyCallback'))) {
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
		if (this.getValueListLength() === 1) {
			//only 1 item in value list
			//
			Ember.run.next(this, function() {
				this._selectItem(getObjectFromArray(valueList, 0));
			});
			return;
		}

		if (this.get('preselectFirst') === true) {
			//preselect item
			Ember.run.next(this, function() {
				this._selectItem(getObjectFromArray(valueList, 0));
			});
			return;
		}
	},

	_destroyDropdownCloseListeners() {
		Ember.$('body').off(`click.hideDropdown_${this.elementId}`);
	},

	cancelLazyDebounce() {
		if (Ember.isPresent(this.get('lazyDebounce'))) {
			clearTimeout(this.get('lazyDebounce'));
			this.set('lazyDebounce', null);
		}
	},

	setLazyDebounce(inputValue) {
		this.cancelLazyDebounce();

		const debounceTime = this.get('configurationService').getLazyDebounceTime();

		let debounceTimer = setTimeout(() => {
			this.cancelLazyDebounce();
			this.set('lazyCallbackInProgress', true);
			let promise = this.get('lazyCallback')(inputValue);
			this.set('valueList', null);
			this.set('valuePromise', promise);
			promise.then(()=>{

				Ember.run.scheduleOnce('afterRender', this, function() {
					this._showDropdown();
					if (this.get('simpleCombobox') === true) {
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
			if (Ember.isPresent(lazyCallback) && Ember.isPresent(inputValue)) {

				if (inputValue.trim().length < this.get('configurationService').getMinLazyCharacters()) {
					this.cancelLazyDebounce();
					if (this.get('dropdownVisible')) {
						this._hideDropdown(false, false);
					}
				} else {
					this.setLazyDebounce(inputValue);
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
