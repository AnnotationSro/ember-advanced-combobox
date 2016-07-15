import Ember from 'ember';
import layout from '../templates/components/combo-box';
import isHtmlSafe from 'ember-string-ishtmlsafe-polyfill';
import {accentRemovalHelper} from '../helpers/accent-removal-helper';


function getObjectFromArray(array, index){
  if (array.objectAt){
    return array.objectAt(index);
  }
  return array[index];
}


const SPACE = 5;

function positionDropdown($dropdown, $input) {

	let {left, top} = $input[0].getBoundingClientRect();

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
  classNameBindings:['labelOnly:combobox-label-only', '_disabledCombobox:combobox-disabled'],
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

//internals
  selectedValueLabel: null,
  dropdownVisible: false,
  internalSelectedList: Ember.A([]),


  sortedValueList: Ember.computed.sort('valueList', 'sortDefinition'),
  sortDefinition: Ember.computed('orderBy', 'itemKey', function() {
    return [ this.get('orderBy')?this.get('orderBy'):this.get('itemKey') ];
  }),


  initCombobox: Ember.on('init', function(){

    this.initSelectedValues();

    this.createSelectedLabel(this.get('internalSelectedList'));
    this.set('inputValue', this.get('selectedValueLabel'));
  }),

  initSelectedValues(){
    //find selected items and assgn them into internalSelectedList
    let selected = this.get('selected');

    if (Ember.isPresent(selected)){
      let itemsArray =  this._itemKeysListToItemObjects(selected);
      this.set('internalSelectedList', itemsArray);
      this.createSelectedLabel(itemsArray);
      this.set('inputValue', this.get('selectedValueLabel'));
    }

    this._automaticallySelect();
  },

  filteredValueList: Ember.computed('inputValue', 'sortedValueList.[]', function () {

    let valueList = this.get('sortedValueList');

    //TODO sorting ------------------------------------------------------------------------------
    // if (Ember.isPresent(this.get('orderBy'))) {
    //   let orderBy = this.get('orderBy');
    //   valueList = _.orderBy(valueList, (itemList)=> {
    //     return itemList.get('item').get(orderBy);
    //   });
    // }

    if (!this.get('canFilter')) {
      return valueList;
    }

    if (Ember.isEmpty(valueList)){
      return valueList;
    }

    var filterQuery  = this.get('inputValue');
    if (Ember.isEmpty(filterQuery)) {
      //no filter is entered
      return valueList;

    } else {
      if (isHtmlSafe(filterQuery)){
        filterQuery = filterQuery.toString();
      }
      filterQuery = accentRemovalHelper(String(filterQuery).toLowerCase());

      //filter the list
      let filteredValueList = valueList.filter((value)=>{
        let valueLabel = this._getItemLabel(value);
        if (isHtmlSafe(valueLabel)){
          valueLabel = valueLabel.toString();
        }

        valueLabel = accentRemovalHelper(String(valueLabel).toLowerCase());
        return valueLabel.indexOf(filterQuery) > -1;
      });

      return filteredValueList;
    }
  }),

  _itemKeysListToItemObjects(itemKeyList){
    let items;
    if (Array.isArray(itemKeyList)){
      items = [];
       itemKeyList.forEach((itemKey)=>{
         let item = this.findItemByKey(itemKey);
         if (item){
          itemKeyList.push(item);
         }
      });
    } else {
        let item = this.findItemByKey(itemKeyList);
        if (item){
          items = [item];
        }
    }
    return new Ember.A(items);
  },

  findItemByKey(key){
    let items = this.get('valueList');
    if (Ember.isNone(items)){
      return null;
    }
    for (let i=0;i<items.length;i++){
      if (this._getItemKey(getObjectFromArray(items,i)) === key){
        return getObjectFromArray(items,i);
      }
    }

    return null;
  },

  selectedObserver: Ember.observer('selected', function(){
    let selected = this.get('selected');
    if (Ember.isEmpty(selected)){
      this.set('internalSelectedList', null);
      this.createSelectedLabel(null);
      this.set('inputValue', this.get('selectedValueLabel'));
      return;
    }
    let itemsArray = this._createArray(selected);
    itemsArray = itemsArray.map((itemKey)=> this.findItemByKey(itemKey));

    this.set('internalSelectedList', itemsArray);
    this.createSelectedLabel(itemsArray);
    this.set('inputValue', this.get('selectedValueLabel'));
  }),

  valuePromiseObserver: Ember.on('init', Ember.observer('valuePromise', function(){
    if (Ember.isPresent(this.get('valuePromise'))){
      //TODO show loader if dropdown visible ------------
      console.log('valuePromise - resolveing......');
      this.get('valuePromise').then((result)=>{
        this.set('valueList', result);
        this.initSelectedValues();
        console.log('valuePromise resolved.');
          //TODO hide loader if dropdown visible ------------
      });
    }
  })),


  valueListObserver: Ember.observer('valueList.[]', function(){
    this._automaticallySelect();

    this.set('internalSelectedList', null);
    this.get('onSelected')(null);

    this.initSelectedValues();
  }),

  _disabledCombobox: Ember.computed('disabled', 'valueList.[]', function(){
    if (this.get('disabled') || Ember.isEmpty(this.get('valueList'))){
      return true;
    }
    return false;
  }),

  //we cannot use {{input readonly=readonly}} because of bug https://github.com/emberjs/ember.js/issues/11828
  inputNotClickableObserver: Ember.on('init', Ember.observer('disabled', 'labelOnly', 'valueList.[]', 'canFilter', function(){
    let notClickable = false;
    if (this.get('disabled')){
      notClickable = true;
    }
    if (this.get('labelOnly')){
      notClickable = true;
    }
    if (Ember.isEmpty(this.get('valueList'))){
      notClickable = true;
    }
    if (this.get('canFilter') === false){
      notClickable = true;
    }

    Ember.run.scheduleOnce('afterRender', this, function() {
        Ember.$(this.element).find('.combo-input').prop('readonly', notClickable);
    });

  })),

  initInputClickHandler: Ember.on('didInsertElement', function(){

    Ember.$(this.element).find('.combo-input').on('click tap', ()=>{
      //comobobox input was clicked (or taped) on
      if (this.get('disabled') || this.get('labelOnly')){
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

  filterObserver: Ember.observer('inputValue', function(){
    if (this.get('dropdownVisible') && this.get('canFilter')){
      this._changeDropdownPosition();
    }
  }),

  /**
   * creates Ember's MutableArray from either single object or array (array may be a plain JS array or Ember MutableArray)
   */
  _createArray(object){
    if (object.map){
      //it is an array
      if (object.objectAt){
        //it is an Ember MutableArray
        return object;
      }else{
        //it is a plain JS array
        return new Ember.A(object);
      }
    }else{
      return new Ember.A([object]);
    }
  },

  _getItemKey(item){
    if (Ember.isPresent(this.get('itemKey'))){
      return Ember.get(item, this.get('itemKey'));
    }else{
      //if no itemKey is specified, use the item object itself
      return item;
    }
  },

  _getItemLabel(item){
    if (Ember.isPresent(this.get('itemLabel'))){
      return Ember.get(item, this.get('itemLabel'));
    }else{
      //if no itemLabel is specified, use the item object itself
      return item;
    }
  },

  _showDropdown(){
    Ember.$(this.element).find('.dropdown').removeClass('dropdown-hidden');
    this.set('dropdownVisible', true);

    this.set('oldInternalSelection', new Ember.A(this.get('internalSelectedList')));
    if (this.get('canFilter')){
      this.set('inputValue', null);
    }else{
      this.set('inputValue', 'TODO vyberte'); //TODO label -------
    }
    this._initDropdownCloseListeners();

    this._changeDropdownPosition();
    Ember.$(window).on(`scroll.combobox-scroll-${this.elementId}`, ()=>{
      this._hideDropdown();
    });
  },

  _changeDropdownPosition(){
    Ember.run.scheduleOnce('afterRender', this, function(){
      let $element = Ember.$(this.element);
      let $dropdown = $element.find('.dropdown');
      let $input = $element.find('.combo-input');
      positionDropdown($dropdown, $input);

      $dropdown.css('width', $input.outerWidth());
    });
  },

  _hideDropdown(acceptSelected){
    Ember.$(this.element).find('.dropdown').addClass('dropdown-hidden');
    Ember.$(window).off(`scroll.combobox-scroll-${this.elementId}`);
    this.set('dropdownVisible', false);

    if (acceptSelected){
      //call selection callback
      let selectedItems = this.get('internalSelectedList');

      if (!this._equalsSelectedList(selectedItems, this._itemKeysListToItemObjects(this.get('selected')))){
        //onSelected callback call only if old selected items are NOT the same as new ones
        if (this.get('multiselect')){
          this.get('onSelected')(this.convertItemListToKeyList(selectedItems));//TODO FIXME this should be called with values only, not whole objects----------
        } else {
          if (Ember.isEmpty(this.convertItemListToKeyList(selectedItems))){
            this.get('onSelected')(null);
          } else {
            this.get('onSelected')(this.convertItemListToKeyList(selectedItems)[0]);
          }
        }
      }
    } else {
      //selection is not accepted -> revert internal selection
      this.set('internalSelectedList', this.get('oldInternalSelection'));
    }

    this.createSelectedLabel(this.get('internalSelectedList'));
    this.set('inputValue', this.get('selectedValueLabel'));
    this._destroyDropdownCloseListeners();

  },

  _equalsSelectedList(list1, list2){
    if (list1.length !== list2.length){
      return false;
    }

    for (let i=0;i<list1.length;i++){
      let item1 = getObjectFromArray(list1, i);
      let item2 = getObjectFromArray(list2, i);

      if (this._getItemKey(item1) !== this._getItemKey(item2)){
        return false;
      }

      return true;
    }

    return Ember.compare(list1, list2) === 0;
  },

  convertItemListToKeyList(itemList){
    if (Ember.isEmpty(itemList)){
      return null;
    }
    return itemList.map((item)=> this._getItemKey(item));
  },

  createSelectedLabel(items){
    let label = null;
    if (Ember.isEmpty(items)){
      //no items were selected
      if (Ember.isEmpty(this.get('valueList'))){
        label = ''; //no valueList
      }else{
        label = "Empty value"; //TODO empty value -------------------------------------
      }
    }else{
      if (items.map){
        //multiple items are selected
        if (items.length === 1){
            label = this._getItemLabel(getObjectFromArray(items, 0));
        } else {
          label = items.map((item)=>this._getItemLabel(item)).join(','); //TODO if more than 1 item, show count instead of labels
        }
      } else {
        //single item is selected
        label = this._getItemLabel(items);
      }
    }
    this.set('selectedValueLabel', label);
  },

  _addOrRemoveFromSelected(item){
    if (!this.get('multiselect')){
      //single select combobox does not perform any selected items removal
      this.set('internalSelectedList', [item]);
    }else{
      //if multiselect combobox, first check if object is not already in selected list
      let selectedList = this.get('internalSelectedList');
      if (Ember.isNone(selectedList)){
          this.set('internalSelectedList', []);
      }

      if (Ember.isPresent(selectedList) && selectedList.find((selectedItem) => this._getItemKey(item) === this._getItemKey(selectedItem))){
        //remove item from list of selected
        selectedList = selectedList.find((selectedItem) => this._getItemKey(item) !== this._getItemKey(selectedItem));
        if (Ember.isPresent(selectedList) && !Array.isArray(selectedList)){
          selectedList = [selectedList];
        }
        this.set('internalSelectedList', selectedList);
      }else{
        this.get('internalSelectedList').push(item);
      }
    }
  },

  _selectItem(item){
    this._addOrRemoveFromSelected(item);
    if (!this.get('multiselect')){
      this._hideDropdown(true);
    }
  },

  /**
   * register event listeners to handle clicking outside of combobox to close it
   */
  _initDropdownCloseListeners(){
    Ember.run.scheduleOnce('afterRender', this, ()=> {

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

            if (this.get('multiselect')){
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
  _automaticallySelect(){
    let valueList = this.get('valueList');
    if (Ember.isEmpty(valueList)){
      return;
    }
    if (valueList.length === 1){
        //only 1 item in value list
        this._selectItem(getObjectFromArray(valueList, 0));
        return;
    }

    if (this.get('preselectFirst') === true){
      //preselect item
      this._selectItem(getObjectFromArray(valueList, 0));
      return;
    }
  },

  _destroyDropdownCloseListeners(){
      Ember.$('body').off(`click.hideDropdown_${this.elementId}`);
  },

  actions:{
    actionDropdownButton(){
      this._showDropdown();
    },

    actionItemSelect(item){
      this._selectItem(item);
    }
  }
});
