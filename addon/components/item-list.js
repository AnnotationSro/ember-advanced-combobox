import Component from '@ember/component';
import layout from '../templates/components/item-list';

export default Component.extend({
  layout,
  tagName: '',
  actionItemSelect(){},
  actions: {
    actionItemSelect(){
      this.get('actionItemSelect')(...arguments);
    }
  }
});
