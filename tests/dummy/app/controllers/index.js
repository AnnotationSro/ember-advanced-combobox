import Ember from 'ember';

export default Ember.Controller.extend({

  comboValueList: [{
    a: 'hello1',
    b: "a"
  }, {
    a: 'hello3',
    b: "c"
  }, {
    a: 'hello2',
    b: "b"
  }, {
    a: 'hello21',
    b: "bb"
  }],
  comboValueListMany: [],
  comboSelectedSingle: null,
  comboPreSelectedSingle: null,
  comboSelectedSingleWithoutFilter: null,
  initialComboSelectedSingle: null,
  comboSelectedMulti: null,
  initialComboSelectedMulti: null,
  oneItemSelectedSingle1: null,
  oneItemSelectedSingle: null,
  comboSelectedSingleAsync: null,
  oneItemValueList: [{
    a: 'hello',
    b: 'I am the only one here'
  }],
  disabled: false,
  labelOnly: false,
  labelOnlyWithNoValue: true,
  comboSelectedLazy: null,

  init() {
    this._super(...arguments);
    this.comboSelectedSingle = 'hello';
    this.comboSelectedPreviewSingle = 'hello1';
    for (let i = 0; i < 50; i++) {
      this.get('comboValueListMany').push({
        a: '' + i,
        b: '' + i
      });
    }
  },

  actions: {

    customPreviewLabelFn(selected){
      if (Ember.isNone(selected)){
        return '';
      }
      return `Selected: ${selected.b}`;
    },

    onDropdownShow() {
      console.log('onDropdownShow');
      this.set('complexValuePromise', new Ember.RSVP.Promise((resolve) => {
        setTimeout(() => {
          resolve(this.get('comboValueList'));
        }, 3000);
      }));
    },

    onDropdownHide() {
      console.log('onDropdownHide');
    },

    onSelectedSingle(selectedValues) {
      if (selectedValues === null){
        return;
      }
      this.set('comboSelectedSingleFormatted', JSON.stringify(selectedValues));
      this.set('comboSelectedSingle', selectedValues.a);
    },

    customDropdownLabelFn(item){
      return `label: ${item.b} - code: ${item.a}`;
    },

    onSelectedCustomDropdownSingle(selectedValues) {
      this.set('comboSelectedCustomDropdownSingleFormatted', JSON.stringify(selectedValues));
      this.set('comboSelectedCustomDropdownSingle', selectedValues.a);
    },

    onSelectedPreviewSingle(selectedValues) {
      this.set('comboSelectedPreviewSingleFormatted', JSON.stringify(selectedValues));
      this.set('comboSelectedPreviewSingle', selectedValues.a);
    },

    onSelectedNoButton(selectedValues) {
      this.set('comboSelectedNoButtonFormatted', JSON.stringify(selectedValues));
      this.set('comboSelectedNoButton', selectedValues.a);
    },

    onSelectedSingleAsync(selectedValues) {
      this.set('comboSelectedSingleFormattedasync', JSON.stringify(selectedValues));
      this.set('comboSelectedSingleAsync', selectedValues.a);
    },

    onOneItemSelected1(selectedValues) {
      this.set('oneItemSelectedSingleFormatted1', JSON.stringify(selectedValues));
      this.set('onOneItemSelected1', selectedValues.a);
    },

    onSelectedSingleWithoutWilter(selectedValues) {
      this.set('comboSelectedSingleFormattedWithoutFilter', JSON.stringify(selectedValues));
      this.set('comboSelectedSingleWithoutFilter', selectedValues.a);
    },

    onOneItemSelected(item) {
      this.set('oneItemSelectedSingleFormatted', JSON.stringify(item));
      this.set('oneItemSelectedSingle', item.a);
    },

    onPreSelectedSingle(selectedValues) {
      this.set('comboPreSelectedSingle', selectedValues.a);
      this.set('comboPreSelectedSingleFormatted', JSON.stringify(selectedValues));
    },

    onSelectedMulti(selectedValues) {
      this.set('comboSelectedMulti', selectedValues.map((o) => o.a));

      if (Ember.isPresent(selectedValues)) {
        this.set('comboSelectedMultiFormatted', selectedValues.map((o) => JSON.stringify(o)).join(','));
      } else {
        this.set('comboSelectedMultiFormatted', null);
      }
    },
    onLazySingle(item){
      this.set('oneItemSelectedLazyFormatted', JSON.stringify(item));
      this.set('oneItemSelectedLazy', item.a);
    },
    actionToggleLabelOnly() {
      this.toggleProperty('labelOnly');
    },
    actionToggleLabelOnlyWithNoValue() {
      this.toggleProperty('labelOnlyWithNoValue');
    },
    actionToggleDisabled() {
      this.toggleProperty('disabled');
    },

    actionCreateAsyncValueList() {
      let valueList = [{
        a: 'hello2',
        b: 'b'
      }, {
        a: 'hello',
        b: 'a'
      }];

      this.set('asyncValueList', new Ember.RSVP.Promise(function(resolve) {
        setTimeout(function() {
          resolve(valueList);
        }, 3000);
      }));
    },

    actionRemoveValueList() {
      this.set('comboValueList', null);
    },

    lazyCallback(query){
      return new Ember.RSVP.Promise(resolve=>{
        let result = [];
        for (let i=0;i<10;i++){
          let text = `${query}_${i+1}`;
          result.push({a: text, b: text});
        }
        setTimeout(()=>{
          resolve(result);
        }, 2000);
      });
    }
  }
});
