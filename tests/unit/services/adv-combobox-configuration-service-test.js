import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | configuration service', function(hooks) {
  setupTest(hooks);


  test('it exists', function(assert) {
    let service = this.owner.lookup('service:adv-combobox-configuration-service');
    assert.ok(service);
  });

  test('it can change global configuration', function(assert) {
    let service = this.owner.lookup('service:adv-combobox-configuration-service');
    service.setConfiguration("emptySelectionLabel", "hello world");

    assert.equal(service.getEmptySelectionLabel(), "hello world");
  });
});
