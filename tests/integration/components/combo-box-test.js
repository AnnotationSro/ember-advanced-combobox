import {Promise as EmberPromise} from 'rsvp';
import $ from 'jquery';
import EmberObject from '@ember/object';
import {later, run} from '@ember/runloop';
import {A} from '@ember/array';
import {isNone} from '@ember/utils';
import Service from '@ember/service';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';
import {click, render, settled, triggerEvent} from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const i18nMock = Service.extend({
  t(key){
    return `dummy-translated-message for ${key}`;
  }
});

function stripComments(str){
  if (isNone(str)){
    return str;
  }
  return str.replace(/<!--(.*?)-->/gm, "");
}

function isElementVisible(selector) {
  let el = document.querySelector(selector);
  let style = window.getComputedStyle(el);
  return (style.display !== 'none')
}

function focus(selector) {
  triggerEvent(selector, 'focus');
}

module('Integration | Component | combo box', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);

    this.owner.register('service:i18n', i18nMock);
    this.i18n = this.owner.lookup('service:i18n');
  });


  //----------
  // we cannot test opening and closing of the dropdown, since it all depends on "focus" event, that is not handled properly by ember testing framework
  //----------


  test('it shows and hides dropdown when clicked into input', async function (assert) {

    let valueList = A([{key: "a", label: "label1"}, {key: "b", label: "label2"}, {key: "aa", label: "label3"}]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
      }}
    `);

    //just to be sure - dropdown should not be visible, yet
    assert.notOk(isElementVisible('.advanced-combo-box .dropdown-hidden'), "dropdown found - it should NOT present in DOM before user clicks on combobox");

    focus('.combo-input');

    later(this, () => {
      //dropdown should be visible
      assert.ok(isElementVisible('.advanced-combo-box .dropdown-hidden'), "dropdown NOT found - it should present in DOM before user clicks on combobox");
    }, 100);

  });

  test('it shows and hides dropdown when clicked on button', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    let valueList = A([{key: "a", label: "label1"}, {key: "b", label: "label2"}, {key: "aa", label: "label3"}]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
      }}
    `);

    //just to be sure - dropdown should not be visible, yet
    assert.notOk(isElementVisible('.advanced-combo-box .dropdown-hidden'), "dropdown should NOT be present in DOM before user clicks on combobox");


    // await click('.dropdown-icon');

    focus('.dropdown-icon');


    later(this, () => {
      //dropdown should be visible
      assert.ok(isElementVisible('.advanced-combo-box .dropdown-hidden'), "dropdown should be present in DOM before user clicks on combobox");
    }, 100);


  });

  test('it DOES NOT show and hides dropdown when clicked on button with `showDropdownOnClick=false`', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    let valueList = A([{key: "a", label: "label1"}, {key: "b", label: "label2"}, {key: "aa", label: "label3"}]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
        showDropdownOnClick=false
      }}
    `);

    //just to be sure - dropdown should not be visible, yet
    assert.notOk(isElementVisible('.advanced-combo-box .dropdown-hidden'), "dropdown should NOT be present in DOM before user clicks on combobox");


    // await click('.dropdown-icon');

    focus('.dropdown-icon');


    later(this, () => {
      //dropdown should be visible
      assert.notOk(isElementVisible('.advanced-combo-box .dropdown-hidden'), "dropdown should be present in DOM before user clicks on combobox");
    }, 100);


  });

  test('it shows and hides dropdown when clicked into input - without button', async function (assert) {

    let valueList = A([{key: "a", label: "label1"}, {key: "b", label: "label2"}, {key: "aa", label: "label3"}]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
        showDropdownButton=false
      }}
    `);

    //just to be sure - dropdown should not be visible, yet
    assert.notOk(isElementVisible('.dropdown.dropdown-hidden'));
    //there should be no dropdown button visible
    // assert.notOk(isElementVisible('.dropdown-icon'));


    focus('.combo-input');

    later(this, function () {
      //dropdown should be visible
      assert.ok(isElementVisible('.dropdown.dropdown-hidden'));
    }, 100);


  });

  test('it DOES NOT shows and hides dropdown when clicked into input - without button - with `showDropdownOnClick=false`', async function (assert) {

    let valueList = A([{key: "a", label: "label1"}, {key: "b", label: "label2"}, {key: "aa", label: "label3"}]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
        showDropdownButton=false
        showDropdownOnClick=false
      }}
    `);

    //just to be sure - dropdown should not be visible, yet
    assert.notOk(isElementVisible('.dropdown.dropdown-hidden'));
    //there should be no dropdown button visible
    // assert.notOk(isElementVisible('.dropdown-icon'));


    focus('.combo-input');

    later(this, function () {
      //dropdown should be visible
      assert.notOk(isElementVisible('.dropdown.dropdown-hidden'));
    }, 100);


  });


  test('it renders plain JSON array as valueList', async function (assert) {

    let valueList = A([{key: "a", label: "label1"}, {key: "b", label: "label2"}, {key: "aa", label: "label3"}]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
      }}
    `);

    let $this = this.$();

    //open dropdown
    await click('.dropdown-icon');


    assert.equal($this.find('.dropdown-item').length, valueList.length);

  });


  test('it renders Ember Object array as valueList', async function (assert) {

    let obj1 = EmberObject.extend({}).create({
      key: 'a',
      label: "label1"
    });
    let obj2 = EmberObject.extend({}).create({
      key: 'b',
      label: "label2"
    });
    let obj3 = EmberObject.extend({}).create({
      key: 'c',
      label: "label3"
    });

    let valueList = A([obj1, obj2, obj3]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
      }}
    `);

    let $this = this.$();

    //open dropdown
    await click('.dropdown-icon');

    assert.equal($this.find('.dropdown-item').length, valueList.length);

  });

  test('it sorts plain JSON array', async function (assert) {

    let valueList = A([{key: "f", label: "labela"}, {key: "b", label: "labelb"}, {key: "aa", label: "labelaa"}]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    this.set('orderBy', 'label');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
        orderBy=orderBy
      }}
    `);

    let $this = this.$();

    //open dropdown
    await click('.dropdown-icon');

    let $items = $this.find('.dropdown-item');
    assert.equal(stripComments($($items[0]).html()).trim(), 'labela');
    assert.equal(stripComments($($items[1]).html()).trim(), 'labelaa');
    assert.equal(stripComments($($items[2]).html()).trim(), 'labelb');


  });


  test('it sorts Ember Object array', async function (assert) {

    let obj1 = EmberObject.extend({}).create({
      key: 'a',
      label: "labela"
    });
    let obj2 = EmberObject.extend({}).create({
      key: 'b',
      label: "labelc"
    });
    let obj3 = EmberObject.extend({}).create({
      key: 'c',
      label: "labelaa"
    });

    let valueList = A([obj1, obj2, obj3]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    this.set('orderBy', 'label');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
        orderBy=orderBy
      }}
    `);

    let $this = this.$();

    //open dropdown
    await click('.dropdown-icon');

    let $items = $this.find('.dropdown-item');
    assert.equal(stripComments($($items[0]).html()).trim(), 'labela');
    assert.equal(stripComments($($items[1]).html()).trim(), 'labelaa');
    assert.equal(stripComments($($items[2]).html()).trim(), 'labelc');


  });


  test('it resolves valueList Promise ', async function (assert) {
    let done = assert.async();

    let obj1 = EmberObject.extend({}).create({
      key: 'a',
      label: "labela"
    });
    let obj2 = EmberObject.extend({}).create({
      key: 'b',
      label: "labelc"
    });
    let obj3 = EmberObject.extend({}).create({
      key: 'c',
      label: "labelaa"
    });

    let valueList = A([obj1, obj2, obj3]);

    let valueListPromise = new EmberPromise(function (resolve) {
      setTimeout(function () {
        resolve(valueList);
      }, 10);
    });

    this.set('valuePromise', valueListPromise);
    this.set('selected', 'b');
    this.set('orderBy', 'label');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valuePromise=valuePromise
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
        orderBy=orderBy
      }}
    `);

    let $this = this.$();

    settled().then(() => {
      valueListPromise.then(function () {
        run(() => {
          $this.find('.dropdown-icon').click();

          assert.equal($this.find('.dropdown-item').length, valueList.length);
          done();
        });
      });
    });
  });


  test('it handles empty valueList - cliking on dropdown button', async function (assert) {

    // Template block usage:
    await render(hbs`
      {{combo-box
        itemKey='key'
        itemLabel='label'
      }}
    `);

    run(() => {
      assert.equal(this.$().find('.combobox-disabled').length, 1);
    });

    //open dropdown - should not work
    focus('.dropdown-icon');

    later(this, ()=>{
      assert.notOk(isElementVisible('.dropdown.dropdown-hidden'));
    }, 100);


  });

  test('it handles empty valueList - cliking on combobox input', async function (assert) {

    // Template block usage:
    await render(hbs`
        {{combo-box
          itemKey='key'
          itemLabel='label'
        }}
      `);

    run(() => {
      assert.equal(this.$().find('.combobox-disabled').length, 1);
    });

    //open dropdown - should not work

    focus('.combo-input');
    later(this, () => {
      assert.notOk(isElementVisible('.dropdown.dropdown-hidden'));
    }, 100);

  });


  test('it calls selected callback', async function (assert) {

    let obj1 = EmberObject.extend({}).create({
      key: 'a',
      label: "label1"
    });
    let obj2 = EmberObject.extend({}).create({
      key: 'b',
      label: "label2"
    });
    let obj3 = EmberObject.extend({}).create({
      key: 'c',
      label: "label3"
    });

    let valueList = A([obj1, obj2, obj3]);

    var done = assert.async();

    this.set('valueList', valueList);
    this.set('selected', 'b');
    this.actions.onSelected = function (value) {
      assert.ok(value);
      assert.equal(value.get('key'), obj1.get('key'));
      assert.equal(value.get('label'), obj1.get('label'));
      assert.equal(value, obj1);
      done();
    };

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        onSelected=(action 'onSelected')
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
      }}
    `);

    let $this = this.$();

    //open dropdown
    focus('.dropdown-icon');
    later(this, () => {
      $($this.find('.dropdown-item')[0]).click();
    }, 100);


  });


  test('it calls multiselect selected callback - adds new selected items', async function (assert) {

    let obj1 = EmberObject.extend({}).create({
      key: 'a',
      label: "label1"
    });
    let obj2 = EmberObject.extend({}).create({
      key: 'b',
      label: "label2"
    });
    let obj3 = EmberObject.extend({}).create({
      key: 'c',
      label: "label3"
    });

    let valueList = A([obj1, obj2, obj3]);

    var done = assert.async();

    this.set('valueList', valueList);
    this.set('selected', 'c');
    this.actions.onSelected = function (value) {
      assert.ok(value);

      assert.equal(value.length, 3);
      assert.equal(value[0].get('key'), obj3.get('key'));
      assert.equal(value[0].get('label'), obj3.get('label'));

      assert.equal(value[1].get('key'), obj1.get('key'));
      assert.equal(value[1].get('label'), obj1.get('label'));

      assert.equal(value[2].get('key'), obj2.get('key'));
      assert.equal(value[2].get('label'), obj2.get('label'));
      done();
    };

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        onSelected=(action 'onSelected')
        itemKey='key'
        itemLabel='label'
        multiselect=true
        canFilter=false
      }}
      <button id="confirm">ok</button>
    `);

    let $this = this.$();

    //open dropdown
    focus('.dropdown-icon');

    later(this, ()=>{
      $($this.find('.dropdown-item')[0]).click();
      // Ember.$($this.find('.dropdown-item')[1]).click();

      $($this.find('.dropdown-item')[1]).click();

      // close dropdown = confirm selection
      click('#confirm');
    }, 100);

  });

  /**
   * user clicks on already selected item -> it sould not be selected at the end
   */
  test('it calls multiselect selected callback - removes selected items', async function (assert) {

    let obj1 = EmberObject.extend({}).create({
      key: 'a',
      label: "label1"
    });
    let obj2 = EmberObject.extend({}).create({
      key: 'b',
      label: "label2"
    });
    let obj3 = EmberObject.extend({}).create({
      key: 'c',
      label: "label3"
    });

    let valueList = A([obj1, obj2, obj3]);

    var done = assert.async();

    this.set('valueList', valueList);
    this.set('selected', 'b');
    this.actions.onSelected = function (value) {
      assert.ok(value);
      assert.equal(value.length, 1);
      assert.equal(value[0].get('key'), obj1.get('key'));
      assert.equal(value[0].get('label'), obj1.get('label'));
      assert.equal(value[0], obj1);

      done();
    };

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        onSelected=(action 'onSelected')
        itemKey='key'
        itemLabel='label'
        multiselect=true
        canFilter=false
      }}
       <button id="confirm">ok</button>
    `);

    let $this = this.$();

    //open dropdown
    focus('.dropdown-icon');

    later(this, ()=> {
      $($this.find('.dropdown-item')[0]).click();
      // Ember.$($this.find('.dropdown-item')[1]).click();


      $($this.find('.dropdown-item')[1]).click();

      // close dropdown = confirm selection
      click('#confirm');
    });
  });

  test('it does not call selected callback because user selected value that was already selected', async function (assert) {
    assert.expect(0);

    let obj1 = EmberObject.extend({}).create({
      key: 'a',
      label: "label1"
    });
    let obj2 = EmberObject.extend({}).create({
      key: 'b',
      label: "label2"
    });
    let obj3 = EmberObject.extend({}).create({
      key: 'c',
      label: "label3"
    });

    let valueList = A([obj1, obj2, obj3]);

    var done = assert.async();

    this.set('valueList', valueList);
    this.set('selected', 'a');
    this.actions.onSelected = function () {
      assert.ok(null, "onSelected callback was called - this is wrong");//should not be called
    };

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        onSelected=(action 'onSelected')
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
      }}
    `);

    let $this = this.$();

    //open dropdown
    await click('.dropdown-icon');

    $($this.find('.dropdown-item')[0]).click();

    settled().then(() => {
      run(() => {
        done();
      });
    });

  });


  test('it calls onDropdownShow/Hide callbacks', async function (assert) {
    assert.expect(2);

    let obj1 = EmberObject.extend({}).create({
      key: 'a',
      label: "label1"
    });
    let obj2 = EmberObject.extend({}).create({
      key: 'b',
      label: "label2"
    });
    let obj3 = EmberObject.extend({}).create({
      key: 'c',
      label: "label3"
    });

    let valueList = A([obj1, obj2, obj3]);

    var done = assert.async();

    this.set('valueList', valueList);
    this.set('selected', 'a');
    this.actions.onDropdownShow = function () {
      assert.ok(true);
    };

    this.actions.onDropdownHide = function () {
      assert.ok(true);
    };

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=false
        onDropdownHide=(action 'onDropdownHide')
        onDropdownShow=(action 'onDropdownShow')
      }}
    `);

    let $this = this.$();

    //open dropdown
    focus('.dropdown-icon');

    later(this, ()=>{
      $($this.find('.dropdown-item')[0]).click();


      settled().then(() => {
        run(() => {
          done();
        });
      });
    }, 100);

  });


  test('it filters valueList', async function (assert) {

    let valueList = A([{key: "a", label: "label1"}, {key: "b", label: "label12"}, {key: "aa", label: "label3"}]);

    this.set('valueList', valueList);
    this.set('selected', null);
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=true
      }}
    `);

    let $this = this.$();


    await click('.dropdown-icon');
    $this.find('input').val('label1');

    var e = $.Event('keyup');
    e.key = '1';
    $this.find('input').trigger(e);


    //open dropdown
    run(() => {
      assert.equal($this.find('.dropdown-item').length, 2);
    });

  });

  test('it filters valueList with previously selected value', async function (assert) {

    let valueList = A([{key: "a", label: "label1"}, {key: "b", label: "label12"}, {key: "aa", label: "label3"}]);

    this.set('valueList', valueList);
    this.set('selected', 'b');
    // that.on('onSelected', function(value){
    //   debugger;
    // });

    // Template block usage:
    await render(hbs`
      {{combo-box
        valueList=valueList
        selected=selected
        itemKey='key'
        itemLabel='label'
        multiselect=false
        canFilter=true
      }}
    `);

    let $this = this.$();

    await click('.dropdown-icon');
    $this.find('input').val('label1');

    var e = $.Event('keyup');
    e.key = '1';
    $this.find('input').trigger(e);


    //open dropdown
    run(() => {
      assert.equal($this.find('.dropdown-item').length, 2);
    });


  });
});
