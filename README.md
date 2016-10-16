# Ember-advanced-combobox

[![Build Status](https://travis-ci.org/AnnotationSro/ember-advanced-combobox.svg?branch=master)](https://travis-ci.org/AnnotationSro/ember-advanced-combobox)

Ember combobox that can (beside others):
 - filter items
 - sort items
 - multiselect items
 - mobile support ("almost" as native)

**Beware** ember >=2.0.0 is supported


## Installation

**Warning: works for Ember >= 2.0.0**

```
ember install ember-advanced-combobox
```


## Example Usage

```
{{combo-box
  id='sampleCombo'
  class='my-combo'
  valueList=valueList
  selected=selectedItem
  itemKey='itemKey'
  itemLabel='itemLabel'
  multiselect=false
  onSelected=(action 'onSelected')
  canFilter=true
  disabled=disabled
  onDropdownShow=(action 'onDropdownShow')
}}
```


| Configuration option | Description                                                                                                                                           |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| valueList            | Array of items in combobox - can be a plain JSON array or Ember MutableArray                                                                          |
| valuePromise         | Promise - when evaluated, the result will be used as `valueList` (note: either `valueList` or `valuePromise` must be provided)                        |
| itemKey              | Name of the property of valueList items to be used is key to identify items                                                                           |
| itemLabel            | Name of the property of valueList items to be used as label                                                                                           |
| selected             | Key of currently selected item                                                                                                                        |
| onSelected           | Action callback that will be called when user selects an item                                                                                         |
| multiselect          | boolean value; it `true` user can select multiple items (default is `false`)                                                                          |
| canFilter            | boolean value; if `true` user can filter values in the dropdown - filter is case- and accent- insensitive fulltext search                             |
| disabled             | boolean value                                                                                                                                         |
| orderBy              | Name of the property of valueList items to be used to sort the items in dropdown. If `orderBy` is not provided, items in dropdown will not be sorted. |
| preselectFirst       | boolean value; if `true` combobox will automatically select the first item in the dropdown.                                                           |
| onDropdownShow       | Action callback called when dropdown is going to show                                                           |
| onDropdownHide       | Action callback called when dropdown is going to hide                                                             |

Also note that if there is only one item in the `valueList`, it will be automatically selected.

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
    emptyValueList: "No items"
  }
  //---------------------------

}
```

Configuration service `ember-advanced-combobox/adv-combobox-configuration-service` enables you to customize the combobox at runtime (e.g. beacuse of translations):

```
  comboboxConfig: Ember.inject.service('adv-combobox-configuration-service');

  this.get('comboboxConfig').setConfiguration("emptySelectionLabel", "some value");

```
