import Ember from 'ember';
import layout from '../templates/components/combo-box';

function get(object, property){
  if (object.get){
    return object.get(property);
  }else{
    return object[property];
  }
}

function getObjectFromArray(array, index){
  if (array.objectAt){
    return array.objectAt(index);
  }
  return array[index];
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

//internals
  selectedValueLabel: null,
  dropdownVisible: false,
  internalSelectedList: Ember.A([]),


  initCombobox: Ember.on('init', function(){

    this.initSelectedValues();

    this.createSelectedLabel(this.get('internalSelectedList'));
    this.set('inputValue', this.get('selectedValueLabel'));
  }),

  initSelectedValues(){
    //find initiallySelected items and assgn them into internalSelectedList
    let initiallySelected = this.get('selected');

    if (Ember.isPresent(initiallySelected)){
          let selectedItems;
      if (Array.isArray(initiallySelected)){
        selectedItems = [];
         initiallySelected.forEach((itemKey)=>{
           let item = this.findItemByKey(itemKey);
           if (item){
            selectedItems.push(item);
           }
        });
      } else {
          let item = this.findItemByKey(initiallySelected);
          if (item){
            selectedItems = [item];
          }
      }
      let itemsArray =  new Ember.A(selectedItems);
      this.set('internalSelectedList', itemsArray);
      this.createSelectedLabel(itemsArray);
      this.set('inputValue', this.get('selectedValueLabel'));
    }
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
    let itemsArray = this._createArray(this.get('selected'));
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
    this.set('internalSelectedList', null);
    this.get('onSelected')(null);
    this.createSelectedLabel(null);
    this.set('inputValue', this.get('selectedValueLabel'));
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

      this._toggleDropdown();
      Ember.run.scheduleOnce('afterRender', this, function() {
        Ember.$(this.element).find('.combo-input-with-dropdown').focus();
      });

    });
  }),

  filterObserver: Ember.observer('inputValue', function(){
    if (this.get('dropdownVisible') && this.get('canFilter')){
      //TODO filter dropdown ------------------------------------------------------
      console.log(this.get('inputValue'));
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
      return get(item, this.get('itemKey'));
    }else{
      //if no itemKey is specified, use the item object itself
      return item;
    }
  },

  _getItemLabel(item){
    if (Ember.isPresent(this.get('itemLabel'))){
      return get(item, this.get('itemLabel'));
    }else{
      //if no itemLabel is specified, use the item object itself
      return item;
    }
  },

  _showDropdown(){
    Ember.$(this.element).find('.dropdown').removeClass('dropdown-hidden');
    this.set('dropdownVisible', true);

    if (this.get('canFilter')){
      this.set('inputValue', null);
    }else{
      this.set('inputValue', 'TODO vyberte'); //todo label -------
    }
  },

  _hideDropdown(){
    Ember.$(this.element).find('.dropdown').addClass('dropdown-hidden');
    this.set('dropdownVisible', false);

    //call selection callback
    let selectedItems = this.get('internalSelectedList');
    this.createSelectedLabel(selectedItems);
    this.set('inputValue', this.get('selectedValueLabel'));

    if (this.get('multiselect')){
      this.get('onSelected')(selectedItems);//TODO FIXME this should be called with values only, not whole objects----------
    }else{
      if (Ember.isEmpty(selectedItems)){
        this.get('onSelected')(null);
      }else{
        this.get('onSelected')(selectedItems[0]);
      }
    }

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
        label = items.map((item)=>this._getItemLabel(item)).join(','); //TODO if more than 1 item, show count instead of labels
      }else{
        //single item is selected
        label = this._getItemLabel(items);
      }
    }
    this.set('selectedValueLabel', label);
  },

  _toggleDropdown(){
    if (this.get('dropdownVisible')){
      this._hideDropdown();
    }else{
      this._showDropdown();
    }
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
      this._hideDropdown();
    }
  },

  actions:{
    actionDropdownButton(){
      this._toggleDropdown();
    },

    actionItemSelect(item){
      this._selectItem(item);
    }
  }
});
