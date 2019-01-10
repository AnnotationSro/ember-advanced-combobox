# Ember-advanced-combobox

[![Build Status](https://travis-ci.org/AnnotationSro/ember-advanced-combobox.svg?branch=master)](https://travis-ci.org/AnnotationSro/ember-advanced-combobox)

Ember combobox that can (beside others):
 - filter items
 - sort items
 - multiselect items
 - mobile support ("almost" as native)
 - lazy loading of combobox items

**Beware** ember >=2.0.0 is supported


## Installation

**Warning: works for Ember >= 2.8.0**

```
ember install ember-advanced-combobox
```


```
{{combo-box  
  valueList=valueList
  selected=selectedItem
  itemKey='itemKey'
  itemLabel='itemLabel'  
  onSelected=(action 'onSelected')  
}}
```

__For more usage examples see dummy application.__


| Configuration option | Description                                                                                                                                           |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| valueList            | Array of items in combobox - can be a plain JSON array or Ember MutableArray (note: either `valueList`, `valuePromise` or `lazyCallback` must be provided)                                                                          |
| valuePromise         | Promise - when evaluated, the result will be used as `valueList` (note: either `valueList`, `valuePromise` or `lazyCallback` must be provided)                        |
| lazyCallback         |callback to retrieve new combobox list items - usefull for lazy-loaded comboboxes (note: either `valueList`, `valuePromise` or `lazyCallback` must be provided)
| itemKey              | Name of the property of valueList items to be used is key to identify items                                                                           |
| itemLabel            | Name of the property of valueList items to be used as; can be string or function label                                                                                           |
| selected             | Key of currently selected item                                                                                                                        |
| onSelected           | Action callback that will be called when user selects an item                                                                                         |
|disabledWhenEmpty     | Combobox will be disabled, when there are no options in dropdown menu (recommened to set to `false` when used with `valuePromise`) (default: `true`)|
| multiselect          | boolean value; it `true` user can select multiple items (default is `false`)                                                                          |
| canFilter            | boolean value; if `true` user can filter values in the dropdown - filter is case- and accent- insensitive fulltext search                             |
| disabled             | boolean value                                                                                                                                         |
| orderBy              | Name of the property of valueList items to be used to sort the items in dropdown. If `orderBy` is not provided, items in dropdown will not be sorted. |
| minLazyCharacters | overrides `minLazyCharacters` (see global configuration section)|
| preselectFirst       | boolean value; if `true` combobox will automatically select the first item in the dropdown.                                                           |
| onDropdownShow       | Action callback called when dropdown is going to show                                                           |
| onDropdownHide       | Action callback called when dropdown is going to hide                                                             |
| showDropdownButton       | boolean value; if `false` the dropdown button will be hidden (default is `true`)                                                             |
| itemLabelForSelectedPreview       | string value of function; customize how selected value looks like in the combobox (only for single select combobox); default is the same property as `itemLabel` |     
| showLabelWhenDisabled       | boolean; `false` when combobox should be empty when disabled (default is `false`) |   
| showChooseLabel       | boolean; `false` 'chooseLabel' should be shown - see global configuration as well (default is `true`) |   
| showEmptySelectionLabel       | boolean; `false` 'emptySelectionLabel' should be shown - see global configuration as well (default is `true`) |   
| maxDropdownHeight       | number; max height of dropdown (in pixels) - optional, if not set, dropdown will be stretched to the max height to be still visible in the page |   
| emptySelectionLabel | overrides `emptySelectionLabel` (see global configuration section)|
| chooseLabel | overrides `chooseLabel` (see global configuration section)|
| pagination| boolean (default: false); `true` if you want items in dropdown to be fetched with pagination|
| pageSize| number (default: 10)|
| showDropdownOnClick| boolean (default: true); `true` if dropdown should be opened on click|
| confirmInputValueOnBlur| boolean (default: false)| when set to `true`, user can enter value into the filter and DID NOT select filtered value in the dropdown - he can just click outside the combobox, and the value will still be selected| 



Also note that if there is only one item available in combobox, it will be automatically selected.

## Styling

Most often you would like to style the mobile version of combobox. To do this you can make use of following CSS classes:
  - ```.combobox-mobile-dialog ``` - dialog itself (container for all other elements)
  - ```.header ``` - DIV above the dialog
  - ```.footer ``` - DIV below the dialog (contains buttons)
  - ```.btn-cancel ``` - button to cancel dialog
  - ```.btn-accept ``` - button to confirm selection (for multiselect combobox only)

## Global configuration

| Configuration option  | Description                                                                                            | Default value      |
|-----------------------|--------------------------------------------------------------------------------------------------------|--------------------|
| emptySelectionLabel   | Label shown when no value is selected                                                                  | ""                 |
| chooseLabel           | Label shown when dropdown is visible                                                                   | "Choose:"          |
| multiselectValueLabel | Label shown when there are multiple values selected -  it appends number of selected items at the end  | "Selected items: " |
| asyncLoaderStartLabel | Label shown when valuePromise is being evaluated                                                       | "Loading..."       |
| emptyValueList        | Label shown when there are no items in dropdown                                                        | "No items"       |
| mobileFilterPlaceholder| Placeholder for filter input in mobile dropdown                                                       | "Enter filter here" |
| mobileOkButton| Text for "OK" button in mobile dropdown                                                                        | "Confirm"          |
| mobileCancelButton| Text for "Cancel" button in mobile dropdown                                                                | "Cancel"          |
| lazyDebounceTime | debounce time (in msec) when typing - used for lazy loading of comobobox items | 1000 |
| minLazyCharacters | minimum number of characters to trigger lazy load fetch | 3 |
| icons | JSON of font icons used | see example above |


There are 2 ways to configure the combobox: using `config/environment.js` or by injecting service `ember-advanced-combobox/adv-combobox-configuration-service`:

### environment.js configuration
Add this to your `config/environment.js` file:
```
  var ENV = {

  //------------------------
  "ember-advanced-combobox": {
    emptySelectionLabel: "",
    chooseLabel: "Choose:",
    multiselectValueLabel: "Selected items: ",
    asyncLoaderStartLabel: "Loading...",
    emptyValueList: 'No items',
    mobileFilterPlaceholder: 'Enter filter here',
    mobileOkButton: 'Confirm',
    mobileCancelButton: 'Cancel',
    lazyDebounceTime: 1000,
    minLazyCharacters: 3,
    icons: {
      dropdown: 'fa fa-chevron-down',
      'checkbox-checked': 'fa fa-check-square-o',
      'checkbox-unchecked': 'fa fa-square-o',
      loading: 'fa fa-circle-o-notch fa-spin fa-fw'
    }
  }
  //---------------------------

}
```

Configuration service `ember-advanced-combobox/adv-combobox-configuration-service` enables you to customize the combobox at runtime (e.g. beacuse of translations):

```
  comboboxConfig: Ember.inject.service('adv-combobox-configuration-service');

  this.get('comboboxConfig').setConfiguration("emptySelectionLabel", "some value");

```
