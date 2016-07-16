import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';

moduleForComponent('combo-box', 'Integration | Component | combo box', {
  integration: true
});


test('it shows and hides dropdown when clicked into input', function(assert) {

  let valueList = [{key: "a", label:"label1"}, {key: "b", label:"label2"}, {key: "aa", label:"label3"}];

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
  assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 1);

  Ember.run(()=>{
    this.$('.combo-input').click();

    //dropdown should be visible
    assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 0);
  });

});

test('it shows and hides dropdown when clicked on button', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  let valueList = [{key: "a", label:"label1"}, {key: "b", label:"label2"}, {key: "aa", label:"label3"}];

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
  assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 1);

  Ember.run(()=>{
    this.$('.dropdown-icon').click();

    //dropdown should be visible
    assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 0);
  });

});


test('it renders plain JSON array as valueList', function(assert) {

  let valueList = [{key: "a", label:"label1"}, {key: "b", label:"label2"}, {key: "aa", label:"label3"}];

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
    assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 0);
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
    assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 0);
    assert.equal($this.find('.dropdown-item').length, valueList.length);
  });

});

test('it sorts plain JSON array', function(assert) {

  let valueList = [{key: "f", label:"labela"}, {key: "b", label:"labelb"}, {key: "aa", label:"labelaa"}];

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
    assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 0);
    let $items = $this.find('.dropdown-item');
    assert.equal($($items[0]).html().trim(), 'labela');
    assert.equal($($items[1]).html().trim(), 'labelaa');
    assert.equal($($items[2]).html().trim(), 'labelb');
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
    assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 0);
    let $items = $this.find('.dropdown-item');
    assert.equal($($items[0]).html().trim(), 'labela');
    assert.equal($($items[1]).html().trim(), 'labelaa');
    assert.equal($($items[2]).html().trim(), 'labelc');
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

        this.$('.dropdown-icon').click();

        assert.equal($this.find('.dropdown.dropdown-hidden').length, 0);
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
    assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 1);
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
    assert.equal(this.$().find('.dropdown.dropdown-hidden').length, 1);
  });

});
