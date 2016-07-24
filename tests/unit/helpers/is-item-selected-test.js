import { isItemSelected } from 'dummy/helpers/is-item-selected';
import { module, test } from 'qunit';

module('Unit | Helper | is item selected');

test('it finds item in list', function(assert) {
  let result = isItemSelected([['a', 'b'], 'a']);
  assert.equal(result, true);
});

test('it does not find item in list', function(assert) {
  let result = isItemSelected([['a', 'b'], 'x']);
  assert.equal(result, false);
});

test('it handles null item', function(assert) {
  let result = isItemSelected([['a', 'b'], null]);
  assert.equal(result, false);
});

test('it handles null list', function(assert) {
  let result = isItemSelected([null, 'a']);
  assert.equal(result, false);
});
