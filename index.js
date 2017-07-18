/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-advanced-combobox',

  options: {
   nodeAssets: {
     'popper.js': {
       srcDir: 'dist/umd',
       import: ['popper.js'],
       vendor: ['popper.js.map']
     },
     'element-resize-detector':{
       srcDir: 'dist',
       import: ['element-resize-detector.js']
     }
   }
 }
};
