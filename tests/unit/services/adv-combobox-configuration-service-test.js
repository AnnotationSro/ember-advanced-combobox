import { moduleFor, test } from 'ember-qunit';

moduleFor('service:adv-combobox-configuration-service', 'Unit | Service | configuration service', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
    integration: true
});


test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});

test('it can change global configuration', function(assert) {
  let service = this.subject();
  service.setConfiguration("emptySelectionLabel", "hello world");

  assert.equal(service.getEmptySelectionLabel(), "hello world");
});
