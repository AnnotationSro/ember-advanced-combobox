import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';

const i18nMock = Ember.Service.extend({
  t(key){
    return `dummy-translated-message for ${key}`;
  }
});

function stripComments(str){
  if (Ember.isNone(str)){
    return str;
  }
  return str.replace(/<!--(.*?)-->/gm, "");
}

moduleForComponent('combo-box', 'Integration | Component | combo box', {
  integration: true,

  beforeEach: function () {
    this.register('service:i18n', i18nMock);
    this.inject.service('i18n');
  }
});

test('it shows and hides dropdown when clicked into input', function(assert) {

  let valueList = new Ember.A([{key: "a", label:"label1"}, {key: "b", label:"label2"}, {key: "aa", label:"label3"}]);

  this.set('valueList', valueList);
  this.set('selected', 'b');
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  this.render(hbs`
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
  assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 1);

  Ember.run(()=>{
    this.$('.combo-input').click();
  });
  Ember.run(()=>{
    //dropdown should be visible
    assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 0);
  });

});

test('it shows and hides dropdown when clicked on button', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  let valueList = new Ember.A([{key: "a", label:"label1"}, {key: "b", label:"label2"}, {key: "aa", label:"label3"}]);

  this.set('valueList', valueList);
  this.set('selected', 'b');
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  this.render(hbs`
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
  assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 1);

  Ember.run(()=>{
    this.$('.dropdown-icon').click();
  });
  Ember.run(()=>{
    //dropdown should be visible
    assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 0);
  });

});

test('it shows and hides dropdown when clicked into input - without button', function(assert) {

  let valueList = new Ember.A([{key: "a", label:"label1"}, {key: "b", label:"label2"}, {key: "aa", label:"label3"}]);

  this.set('valueList', valueList);
  this.set('selected', 'b');
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  this.render(hbs`
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
  assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 1);
  //there should be no dropdown button visible
  assert.equal(this.$().find('.dropdown-icon').length, 0);

  Ember.run(()=>{
    this.$('.combo-input').click();
  });
  Ember.run(()=>{
    //dropdown should be visible
    assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 0);
  });

});


test('it renders plain JSON array as valueList', function(assert) {

  let valueList = new Ember.A([{key: "a", label:"label1"}, {key: "b", label:"label2"}, {key: "aa", label:"label3"}]);

  this.set('valueList', valueList);
  this.set('selected', 'b');
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  this.render(hbs`
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
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
    assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 0);
    assert.equal($this.find('.dropdown-item').length, valueList.length);
  });

});


test('it renders Ember Object array as valueList', function(assert) {

  let obj1 = Ember.Object.extend({}).create({
    key: 'a',
    label:"label1"
  });
  let obj2 = Ember.Object.extend({}).create({
    key: 'b',
    label:"label2"
  });
  let obj3 = Ember.Object.extend({}).create({
    key: 'c',
    label:"label3"
  });

  let valueList = new Ember.A([obj1, obj2, obj3]);

  this.set('valueList', valueList);
  this.set('selected', 'b');
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  this.render(hbs`
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
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
    assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 0);
    assert.equal($this.find('.dropdown-item').length, valueList.length);
  });

});

test('it sorts plain JSON array', function(assert) {

  let valueList = new Ember.A([{key: "f", label:"labela"}, {key: "b", label:"labelb"}, {key: "aa", label:"labelaa"}]);

  this.set('valueList', valueList);
  this.set('selected', 'b');
  this.set('orderBy', 'label');
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  this.render(hbs`
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
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
    assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 0);
    let $items = $this.find('.dropdown-item');
    assert.equal(stripComments(Ember.$($items[0]).html()).trim(), 'labela');
    assert.equal(stripComments(Ember.$($items[1]).html()).trim(), 'labelaa');
    assert.equal(stripComments(Ember.$($items[2]).html()).trim(), 'labelb');
  });

});


test('it sorts Ember Object array', function(assert) {

  let obj1 = Ember.Object.extend({}).create({
    key: 'a',
    label:"labela"
  });
  let obj2 = Ember.Object.extend({}).create({
    key: 'b',
    label:"labelc"
  });
  let obj3 = Ember.Object.extend({}).create({
    key: 'c',
    label:"labelaa"
  });

  let valueList = new Ember.A([obj1, obj2, obj3]);

  this.set('valueList', valueList);
  this.set('selected', 'b');
  this.set('orderBy', 'label');
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  this.render(hbs`
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
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
    assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 0);
    let $items = $this.find('.dropdown-item');
    assert.equal(stripComments(Ember.$($items[0]).html()).trim(), 'labela');
    assert.equal(stripComments(Ember.$($items[1]).html()).trim(), 'labelaa');
    assert.equal(stripComments(Ember.$($items[2]).html()).trim(), 'labelc');
  });

});


test('it resolves valueList Promise ', function(assert) {
  let done = assert.async();

  let obj1 = Ember.Object.extend({}).create({
    key: 'a',
    label:"labela"
  });
  let obj2 = Ember.Object.extend({}).create({
    key: 'b',
    label:"labelc"
  });
  let obj3 = Ember.Object.extend({}).create({
    key: 'c',
    label:"labelaa"
  });

  let valueList = new Ember.A([obj1, obj2, obj3]);

  let valueListPromise = new Ember.RSVP.Promise(function(resolve){
    setTimeout(function(){
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
  this.render(hbs`
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

 wait().then(() => {
  valueListPromise.then(function(){
    Ember.run(()=>{
        $this.find('.dropdown-icon').click();

        assert.equal($this.find('.advanced-combo-box.dropdown-hidden').length, 0);
        assert.equal($this.find('.dropdown-item').length, valueList.length);
        done();
     });
   });
 });
});


test('it handles empty valueList - cliking on dropdown button', function(assert) {

  // Template block usage:
  this.render(hbs`
    {{combo-box
      itemKey='key'
      itemLabel='label'
    }}
  `);

  Ember.run(()=>{
    assert.equal(this.$().find('.combobox-disabled').length, 1);
  });

  //open dropdown - should not work
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
    assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 1);
  });

});

test('it handles empty valueList - cliking on combobox input', function(assert) {

  // Template block usage:
  this.render(hbs`
    {{combo-box
      itemKey='key'
      itemLabel='label'
    }}
  `);

  Ember.run(()=>{
    assert.equal(this.$().find('.combobox-disabled').length, 1);
  });

  //open dropdown - should not work
  Ember.run(()=>{
    this.$('.combo-input').click();
    assert.equal(this.$().find('.advanced-combo-box.dropdown-hidden').length, 1);
  });

});


test('it calls selected callback', function(assert) {

  let obj1 = Ember.Object.extend({}).create({
    key: 'a',
    label:"label1"
  });
  let obj2 = Ember.Object.extend({}).create({
    key: 'b',
    label:"label2"
  });
  let obj3 = Ember.Object.extend({}).create({
    key: 'c',
    label:"label3"
  });

  let valueList = new Ember.A([obj1, obj2, obj3]);

  var done = assert.async();

  this.set('valueList', valueList);
  this.set('selected', 'b');
  this.on('onSelected', function(value){
    assert.ok(value);
    assert.equal(value.get('key'), obj1.get('key'));
    assert.equal(value.get('label'), obj1.get('label'));
    assert.equal(value, obj1);
    done();
  });

  // Template block usage:
  this.render(hbs`
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
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
  });
  Ember.run(()=>{
    Ember.$($this.find('.dropdown-item')[0]).click();
  });

});


test('it calls multiselect selected callback - adds new selected items', function(assert) {

  let obj1 = Ember.Object.extend({}).create({
    key: 'a',
    label:"label1"
  });
  let obj2 = Ember.Object.extend({}).create({
    key: 'b',
    label:"label2"
  });
  let obj3 = Ember.Object.extend({}).create({
    key: 'c',
    label:"label3"
  });

  let valueList = new Ember.A([obj1, obj2, obj3]);

  var done = assert.async();

  this.set('valueList', valueList);
  this.set('selected', 'c');
  this.on('onSelected', function(value){
    assert.ok(value);

    assert.equal(value.length, 3);
    assert.equal(value[0].get('key'), obj3.get('key'));
    assert.equal(value[0].get('label'), obj3.get('label'));

    assert.equal(value[1].get('key'), obj1.get('key'));
    assert.equal(value[1].get('label'), obj1.get('label'));

    assert.equal(value[2].get('key'), obj2.get('key'));
    assert.equal(value[2].get('label'), obj2.get('label'));
    done();
  });

  // Template block usage:
  this.render(hbs`
    {{combo-box
      valueList=valueList
      selected=selected
      onSelected=(action 'onSelected')
      itemKey='key'
      itemLabel='label'
      multiselect=true
      canFilter=false
    }}
  `);

  let $this = this.$();

  //open dropdown
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
  });
  Ember.run(()=>{
    Ember.$($this.find('.dropdown-item')[0]).click();
    // Ember.$($this.find('.dropdown-item')[1]).click();
  });
  Ember.run(()=>{
    Ember.$($this.find('.dropdown-item')[1]).click();
  });
  // close dropdown = confirm selection
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
  });
});

/**
 * user clicks on already selected item -> it sould not be selected at the end
 */
test('it calls multiselect selected callback - removes selected items', function(assert) {

  let obj1 = Ember.Object.extend({}).create({
    key: 'a',
    label:"label1"
  });
  let obj2 = Ember.Object.extend({}).create({
    key: 'b',
    label:"label2"
  });
  let obj3 = Ember.Object.extend({}).create({
    key: 'c',
    label:"label3"
  });

  let valueList = new Ember.A([obj1, obj2, obj3]);

  var done = assert.async();

  this.set('valueList', valueList);
  this.set('selected', 'b');
  this.on('onSelected', function(value){
    assert.ok(value);
    assert.equal(value.length, 1);
    assert.equal(value[0].get('key'), obj1.get('key'));
    assert.equal(value[0].get('label'), obj1.get('label'));
    assert.equal(value[0], obj1);

    done();
  });

  // Template block usage:
  this.render(hbs`
    {{combo-box
      valueList=valueList
      selected=selected
      onSelected=(action 'onSelected')
      itemKey='key'
      itemLabel='label'
      multiselect=true
      canFilter=false
    }}
  `);

  let $this = this.$();

  //open dropdown
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
  });
  Ember.run(()=>{
    Ember.$($this.find('.dropdown-item')[0]).click();
    // Ember.$($this.find('.dropdown-item')[1]).click();
  });
  Ember.run(()=>{
    Ember.$($this.find('.dropdown-item')[1]).click();
  });
  // close dropdown = confirm selection
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
  });
});

test('it does not call selected callback because user selected value that was already selected', function(assert) {
  assert.expect(0);

  let obj1 = Ember.Object.extend({}).create({
    key: 'a',
    label:"label1"
  });
  let obj2 = Ember.Object.extend({}).create({
    key: 'b',
    label:"label2"
  });
  let obj3 = Ember.Object.extend({}).create({
    key: 'c',
    label:"label3"
  });

  let valueList = new Ember.A([obj1, obj2, obj3]);

  var done = assert.async();

  this.set('valueList', valueList);
  this.set('selected', 'a');
  this.on('onSelected', function(){
    assert.ok(null, "onSelected callback was called - this is wrong");//should not be called
  });

  // Template block usage:
  this.render(hbs`
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
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
  });
  Ember.run(()=>{
    Ember.$($this.find('.dropdown-item')[0]).click();
  });

  wait().then(() => {
     Ember.run(()=>{
         done();
    });
  });

});


test('it calls onDropdownShow/Hide callbacks', function(assert) {
  assert.expect(2);

  let obj1 = Ember.Object.extend({}).create({
    key: 'a',
    label:"label1"
  });
  let obj2 = Ember.Object.extend({}).create({
    key: 'b',
    label:"label2"
  });
  let obj3 = Ember.Object.extend({}).create({
    key: 'c',
    label:"label3"
  });

  let valueList = new Ember.A([obj1, obj2, obj3]);

  var done = assert.async();

  this.set('valueList', valueList);
  this.set('selected', 'a');
  this.on('onDropdownShow', function(){
    assert.ok(true);
  });

  this.on('onDropdownHide', function(){
    assert.ok(true);
  });

  // Template block usage:
  this.render(hbs`
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
  Ember.run(()=>{
    this.$('.dropdown-icon').click();
  });
  Ember.run(()=>{
    Ember.$($this.find('.dropdown-item')[0]).click();
  });

  wait().then(() => {
     Ember.run(()=>{
         done();
    });
  });

});


test('it filters valueList', function(assert) {

  let valueList = new Ember.A([{key: "a", label:"label1"}, {key: "b", label:"label12"}, {key: "aa", label:"label3"}]);

  this.set('valueList', valueList);
  this.set('selected', null);
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  this.render(hbs`
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

  $this.find('.dropdown-icon').click();
  $this.find('input').val('label1');
  $this.find('input').trigger('keyup');


  //open dropdown
  Ember.run(()=>{
    assert.equal($this.find('.advanced-combo-box.dropdown-hidden').length, 0);
    assert.equal($this.find('.dropdown-item').length, 2);
  });

});

test('it filters valueList with previously selected value', function(assert) {

  let valueList = new Ember.A([{key: "a", label:"label1"}, {key: "b", label:"label12"}, {key: "aa", label:"label3"}]);

  this.set('valueList', valueList);
  this.set('selected', 'b');
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  this.render(hbs`
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

  $this.find('.dropdown-icon').click();
  $this.find('input').val('label1');
  $this.find('input').trigger('keyup');


  //open dropdown
  Ember.run(()=>{
    assert.equal($this.find('.advanced-combo-box.dropdown-hidden').length, 0);
    assert.equal($this.find('.dropdown-item').length, 2);
  });


});
