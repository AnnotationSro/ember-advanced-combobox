/* eslint no-console: 0 */
/* eslint-disable*/

import $ from 'jquery';
import {
  Promise as EmberPromise
} from 'rsvp';

import {
  isNone,
  isPresent
} from '@ember/utils';
import {
  inject as service
} from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({

  comboValueList: [{
    a: null,
    b: 'ja som prazdny'
  },{
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
  },{
   a: 'xhello21',
   b: "prvy"
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

  showFixedCombo: true,

  myChooseLabel:'ja som myChooseLabel',

  comboboxConfig: service('adv-combobox-configuration-service'),

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



    this.get('comboboxConfig').setConfiguration("emptySelectionLabel", 'choose value');
    this.get('comboboxConfig').setConfiguration("chooseLabel", 'aa');
    this.get('comboboxConfig').setConfiguration("icons", {
      dropdown: 'fa fa-chevron-down',
      'checkbox-checked': 'far fa-check-square',
      'checkbox-unchecked': 'far fa-square',
      loading: 'fas fa-circle-notch fa-spin'
    });

  },

  actions: {

    actionSimpleSelectedCombo(selected) {
      this.set('selectedSimpleCombo', selected.value);
    },
    actionClearSingleCombo() {
      this.set('comboSelectedSingle', null);
    },

    showHideFixed() {
      this.toggleProperty('showFixedCombo');
    },

    customPreviewLabelFn(selected) {
      if (isNone(selected)) {
        return '';
      }
      return `Selected: ${selected.b}`;
    },

    onDropdownShow() {
      console.log('onDropdownShow');
      this.set('complexValuePromise', new EmberPromise((resolve) => {
        setTimeout(() => {
          resolve(this.get('comboValueList'));
        }, 3000);
      }));
    },

    onDropdownHide() {
      console.log('onDropdownHide');
    },

    onSelectedSingle(selectedValues) {
      if (selectedValues === null) {
        return;
      }
      this.set('comboSelectedSingleFormatted', JSON.stringify(selectedValues));
      this.set('comboSelectedSingle', selectedValues.a);
    },

    customDropdownLabelFn(item) {
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

      if (isPresent(selectedValues)) {
        this.set('comboSelectedMultiFormatted', selectedValues.map((o) => JSON.stringify(o)).join(','));
      } else {
        this.set('comboSelectedMultiFormatted', null);
      }
    },
    onLazySingle(item) {
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

      this.set('asyncValueList', new EmberPromise(function(resolve) {
        setTimeout(function() {
          resolve(valueList);
        }, 3000);
      }));
    },

    actionRemoveValueList() {
      this.set('comboValueList', null);
    },

    abortLazyCallback() {
      if (isPresent(this.get('lazyCallbackAjax'))) {
        let xhr = this.get('lazyCallbackAjax');
        if(xhr && xhr.readyState != 4){
            xhr.abort();
        }
        this.set('lazyCallbackAjax', null);
      }
    },

    lazyCallback(query) {
      let a = new EmberPromise((resolve, reject) => {
        let ajax = $.ajax({
          type: "GET",
          url: "https://reqres.in/api/users?delay=2",
          success: function(data) {
            let result = [];
            for (let i = 0; i < 3; i++) {
              let text = `${query}_${i+1}_${data.data[i].first_name}`;
              result.push({
                a: data.data[i].first_name,
                b: text
              });
            }
            resolve(result);
          }
        });
        this.set('lazyCallbackAjax', ajax);
      });

      return a;
    }
  }
});
