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
	onSelected: Ember.K,
	canFilter: false,
	preselectFirst: false,
	orderBy: null,
	noValueLabel: null, //label shown in labelOnly mode when there is no valueList available
	onDropdownShow: Ember.K,
	onDropdownHide: Ember.K,

	//internals
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

	initCombobox: Ember.on('init', function() {

		this.initSelectedValues();

		this.createSelectedLabel(this.get('internalSelectedList'));
		this.set('inputValue', this.get('selectedValueLabel'));

		this._handleLabelOnlyNoValue();

	}),

	setDropdownWidth: Ember.on('didInsertElement', function(){
		let $element = Ember.$(this.element);
		$element.find('.dropdown').css('min-width', $element.css('width'));
	}),

	setInputFocus: Ember.on('didInsertElement', function(){
		let $element = Ember.$(this.element);
			let $inputElement = $element.find('.input-group');
		$inputElement.focus(()=>{
			this.set('isComboFocused', true);
		});
		 $inputElement.blur(()=>{
			 this.set('isComboFocused', false);
		 });
	}),

	onDestroy: Ember.on('didDestroyElement', function() {
		Ember.$(window).off(`scroll.combobox-scroll-${this.elementId}`);
		this._destroyDropdownCloseListeners();
	}),

	//if 'itemLabelForSelectedPreview' is defined, 'itemLabelForSelectedPreview' is used, otherwise 'itemLabel' is used
	internalItemLabelForSelectedPreview: Ember.computed('itemLabelForSelectedPreview', 'itemLabel', function(){
		return this.get('itemLabelForSelectedPreview') || this.get('itemLabel');
	}),

	tabbable: Ember.computed('labelOnly', '_disabledCombobox', function(){
		 return this.get('labelOnly') || this.get('_disabledCombobox');
	}),

	initSelectedValues() {
		//find selected items and assgn them into internalSelectedList
		let selected = this.get('selected');

		if (Ember.isPresent(selected)) {
			let itemsArray = this._itemKeysListToItemObjects(selected);
			this.set('internalSelectedList', itemsArray);
			this.createSelectedLabel(itemsArray);
			if (!this.get('dropdownVisible')){
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
			if (Ember.isNone(this.get('valueList')) && Ember.isPresent(noValueLabel) && noValueLabel.length > 0){
				this.set('inputValue', noValueLabel);
			}else{
				this.createSelectedLabel(selectedItems);
				this.set('inputValue', this.get('selectedValueLabel'));
			}
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

	getValueListLength(){
		if (Ember.isEmpty(this.get('valueList'))){
			return 0;
		}

		let itemsLength = this.get('valueList').length;
		if (typeof itemsLength !== 'number'){
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
		itemsArray = itemsArray.map((itemKey) => this.findItemByKey(itemKey));

		this.set('internalSelectedList', this._createArray(itemsArray));
		this.createSelectedLabel(itemsArray);
		if (!this.get('dropdownVisible')){
			this.set('inputValue', this.get('selectedValueLabel'));
		}
	}),

	valuePromiseObserver: Ember.on('init', Ember.observer('valuePromise', function() {
		if (Ember.isPresent(this.get('valuePromise'))) {
			this.set('valuePromiseResolving', true);
			this.set('inputValue', this.get('configurationService').getAsyncLoaderStartLabel());

			this.get('valuePromise').then((result) => {
				this.set('valuePromiseResolving', false);
				this.set('valueList', result);
				this.set('inputValue', this.get('selectedValueLabel'));
			});
		}
	})),


	valueListObserver: Ember.observer('valueList.[]', function() {
		this.initSelectedValues();
		if (Ember.isEmpty(this.get('internalSelectedList')) && !this.get('dropdownVisible')){
			this.set('inputValue', this.get('configurationService').getChooseLabel());
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

	_disabledCombobox: Ember.computed('disabled', 'valueList.[]', 'labelOnly', 'noValueLabel', function() {
		if (this.get('disabled')){
			return true;
		}

		if (this.get('labelOnly')){
			return false;
		}

		if (Ember.isEmpty(this.get('valueList'))) {
			//if there is no valueList, but 'noValueLabel' is specified, then combobox is not in disabled state - it should show 'noValueLabel' instead
			if (Ember.isPresent(this.get('noValueLabel'))){
				return false;
			}

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

	asyncLoaderStartLabel: Ember.computed(function(){
		return this.get('configurationService').getAsyncLoaderStartLabel();
	}),

	emptyValueListLabel: Ember.computed(function(){
		return this.get('configurationService').getEmptyValueListLabel();
	}),

	/**
	 * creates Ember's MutableArray from either single object or array (array may be a plain JS array or Ember MutableArray)
	 */
	_createArray(object) {
		if (Ember.isNone(object)){
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
		if (Ember.isNone(item)){
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
			return Ember.get(item, this.get('itemLabel'));
		} else {
			//if no itemLabel is specified, use the item object itself
			return item;
		}
	},

	_getPropertyFromItem(item, property){
		if (Ember.isPresent(property)) {
			return Ember.get(item, property);
		} else {
			return item;
		}
	},

	_showDropdown() {
		this.set('dropdownVisible', true);

		this.get('onDropdownShow')();

		this.set('oldInternalSelectionKeys', this._createArray(this.get('selected')));

		if (this.get('canFilter')) {
			this.set('inputValue', '');
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
		});
	},

	_hideDropdown(acceptSelected) {

		this.get('onDropdownHide')();

		Ember.$(window).off(`scroll.combobox-scroll-${this.elementId}`);
		this.set('dropdownVisible', false);

		if (acceptSelected) {
			//call selection callback
			this._callOnSelectedCallback(this.convertItemListToKeyList(this.get('internalSelectedList')), this.get('oldInternalSelectionKeys'));
		} else {
			//selection is not accepted -> revert internal selection
			this.set('internalSelectedList', this._itemKeysListToItemObjects(this.get('oldInternalSelectionKeys')));
		}

		let noValueLabel = this.get('noValueLabel');

		if (Ember.isEmpty(this.get('internalSelectedList')) &&
			!Ember.isEmpty(this.get('selected')) &&
			!Ember.isEmpty(this.get('valueList')) &&
			Ember.isPresent(noValueLabel) &&
			noValueLabel.length > 0
		){
			this.set('inputValue', noValueLabel);
		}else {
			this.createSelectedLabel(this.get('internalSelectedList'));
			this.set('inputValue', this.get('selectedValueLabel'));
		}
		this._destroyDropdownCloseListeners();

	},

	_equalsSelectedList(list1, list2) {
		if (Ember.isNone(list1) && Ember.isNone(list2)){
			//both of them are null/undefined
			return true;
		}
		if (Ember.isNone(list1) || Ember.isNone(list2)){
			//just one of them is null/undefined
			return false;
		}
		if (list1.length !== list2.length) {
			return false;
		}

		let removeObjects = list1.removeObjects(list2);
		return (removeObjects.length===0);
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
					label = this._getPropertyFromItem(getObjectFromArray(items, 0), this.get('internalItemLabelForSelectedPreview'));
				} else {
					label = this.get("configurationService").getMultiselectValueLabel() + items.length;
				}
			} else {
				//single item is selected
				label = this._getPropertyFromItem(items, this.get('internalItemLabelForSelectedPreview'));
			}
		}
		this.set('selectedValueLabel', label);
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
			}else{
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

	_addOrRemoveFromList(list, item){
		let itemPos = list.indexOf(item);
		if (itemPos === -1){
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

	actions: {
		actionDropdownButton() {
			if (this.get('_disabledCombobox')) {
				return;
			}
			if (this.get('dropdownVisible')){
				this._hideDropdown(true);
			}else{
				this._showDropdown();
			}
		},

		actionItemSelect(item) {
			this._selectItem(item);
		}
	}
});
