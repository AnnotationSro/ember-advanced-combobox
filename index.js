/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-advanced-combobox',

  options: {
   nodeAssets: {
     'popper.js': {
       srcDir: 'dist/umd',
       import: ['popper.js'],
       vendor: ['popper.js.map']
     }
   }
 }
};
