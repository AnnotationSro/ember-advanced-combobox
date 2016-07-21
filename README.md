# Ember-advanced-combobox

[![Build Status](https://travis-ci.org/AnnotationSro/ember-advanced-combobox.svg?branch=master)](https://travis-ci.org/AnnotationSro/ember-advanced-combobox)


**Beware** ember >=2.0.0 is supported

## WIP

**Here be dragons** _enter at your own risk_.

---------------------
#### TODO
- labels e.g. for async loading of value list, for multiselect, ...
- MORE TESTS !!!
- **mobile-friendly version**


## Usage

```
{{combo-box
  valueList=valueList
  selected=selectedItem
  itemKey='itemKey'
  itemLabel='itemLabel'
  multiselect=false
  onSelected=(action 'onSelected')
  canFilter=true
  disabled=disabled
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

Also note that if there is only one item in the `valueList`, it will be automatically selected.


## Global configuration

| Configuration option  | Description                                                                                            | Default value      |
|-----------------------|--------------------------------------------------------------------------------------------------------|--------------------|
| emptySelectionLabel   | Label shown when no value is selected                                                                  | ""                 |
| chooseLabel           | Label shown when dropdown is visible                                                                   | "Choose:"          |
| multiselectValueLabel | Label shown when there are multiple values selected -  it appends number of selected items at the end  | "Selected items: " |
| asyncLoaderStartLabel | Label shown when valuePromise is being evaluated                                                       | "Loading..."       |

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
    asyncLoaderStartLabel: "Loading..."
  }
  //---------------------------

}
```

Configuration service `ember-advanced-combobox/adv-combobox-configuration-service` enables you to customize the combobox at runtime (e.g. beacuse of translations):

```
  comboboxConfig: Ember.inject.service('adv-combobox-configuration-service');

  this.get('comboboxConfig').set("emptySelectionLabel", "some value");

```
