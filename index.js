'use strict';

module.exports = {
  name: require('./package').name,

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
