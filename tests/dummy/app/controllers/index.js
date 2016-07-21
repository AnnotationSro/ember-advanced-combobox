import Ember from 'ember';

export default Ember.Controller.extend({

  comboValueList: [{a:'hello1', b:"a"}, {a:'hello3', b:"c"}, {a:'hello2', b:"b"}, {a:'hello21', b:"bb"}],
  comboSelectedSingle: null,
  comboPreSelectedSingle: null,
  initialComboSelectedSingle: null,
  comboSelectedMulti: null,
  initialComboSelectedMulti: null,
  oneItemSelectedSingle: null,
  oneItemValueList: [{a:'hello', b:'I am the only one here'}],
  disabled:false,
  labelOnly:false,

  init(){
    this._super(...arguments);
    this.comboSelectedSingle = 'hello';
  },

  actions: {
    onSelectedSingle(selectedValues){
      this.set('comboSelectedSingle', selectedValues.a);
    },

    onOneItemSelected(item){
      this.set('oneItemSelectedSingle', item);
    },

    onPreSelectedSingle(selectedValues){
        this.set('comboPreSelectedSingle', selectedValues);
    },

    onSelectedMulti(selectedValues){

      this.set('comboSelectedMulti', selectedValues);

      if (Ember.isPresent(selectedValues)){
        this.set('selectedMultiFormatted', selectedValues.map((o) => JSON.stringify(o)).join(','));
      }else{
      this.set('selectedMultiFormatted', null);
    }
    },
    actionToggleLabelOnly(){
      this.toggleProperty('labelOnly');
    },
    actionToggleDisabled(){
      this.toggleProperty('disabled');
    },

    actionCreateAsyncValueList(){
      let valueList = [{a:'hello2', b:'b'}, {a:'hello', b:'a'}];

      this.set('asyncValueList', new Ember.RSVP.Promise(function(resolve){
        setTimeout(function(){
          resolve(valueList);
        },3000);
      }));
    },

    actionRemoveValueList(){
      this.set('comboValueList', null);
    }
  }
});
