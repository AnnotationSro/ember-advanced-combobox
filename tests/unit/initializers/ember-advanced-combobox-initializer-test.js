import Application from '@ember/application';
import { run } from '@ember/runloop';
import EmberAdvancedComboboxInitializerInitializer from 'dummy/initializers/ember-advanced-combobox-initializer';
import { module, test } from 'qunit';

let application;

module('Unit | Initializer | ember advanced combobox initializer', function(hooks) {
  hooks.beforeEach(function() {
    run(function() {
      application = Application.create();
      application.deferReadiness();
    });
  });

  // Replace this with your real tests.
  test('it works', function(assert) {
    EmberAdvancedComboboxInitializerInitializer.initialize(application);

    // you would normally confirm the results of the initializer here
    assert.ok(true);
  });
});
