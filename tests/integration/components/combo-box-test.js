import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('combo-box', 'Integration | Component | combo box', {
  integration: true
});

function initDummyComponent(that){
  let valueList = [{key: "a", label:"label1"}, {key: "b", label:"label2"}, {key: "aa", label:"label3"}];

  that.set('comboboxValueList', valueList);
  that.set('selected', 'b');
  // that.on('onSelected', function(value){
  //   debugger;
  // });

  // Template block usage:
  that.render(hbs`
    {{combo-box
      valueList=comboValueList
      selected=selected
      itemKey='key'
      itemLabel='label'
      multiselect=false
      canFilter=false
    }}
  `);
}

test('it shows and hides dropdown when clicked on button', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  initDummyComponent(this);
  //just to be sure - dropdown should not be visible, yet
  assert.ok(this.$().find('.dropdown.dropdown-hidden'));

  Ember.run(function(){
    this.$('.dropdown-icon').click();
  });

  //dropdown should be visible
  assert.ok(this.$().find('.dropdown:not(.dropdown-hidden)'));
});

test('it shows and hides dropdown when clicked into input', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  initDummyComponent(this);
  //just to be sure - dropdown should not be visible, yet
  assert.ok(this.$().find('.dropdown.dropdown-hidden'));

  Ember.run(function(){
    this.$('.combo-input').click();
  });

  //dropdown should be visible
  assert.ok(this.$().find('.dropdown:not(.dropdown-hidden)'));
});
