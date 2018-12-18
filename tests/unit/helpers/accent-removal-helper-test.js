import { accentRemovalHelper } from 'dummy/helpers/accent-removal-helper';
import { module, test } from 'qunit';

module('Unit | Helper | accent removal helper', function() {
  test('it works', function(assert) {
    let result = accentRemovalHelper("héľĺô");
    assert.equal(result, "hello");
  });

  test('it works with empty or null input', function(assert) {
    let result = accentRemovalHelper("");
    assert.equal(result, "");

    result = accentRemovalHelper(null);
    assert.equal(result, null);

    result = accentRemovalHelper(undefined);
    assert.equal(result, undefined);
  });
});
