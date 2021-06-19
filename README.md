# alt:V Open Source Menu

A menu builder written in TypeScript using Vue with Vuetify.

**I DO NOT GIVE SUPPORT FOR THIS! DO NOT ASK ME TO HELP YOU SET THIS UP!**

## How To Use

1. Clone/Download this repository.
2. Go to the `src/client` directory, run `npm i` and then `npm run build`.
3. Go to the `src/browser` directory, run `npm i` and then `npm run build`.
4. Copy the whole `src/browser` directory to your alt:V server `resources` folder.
5. Add `browser` to the `resources` array in your `server.cfg`.

Depending on if you use JavaScript or TypeScript in your own resource, you need to include the output `.js` files
in the `src/client/dist` directory, or if you are using TypeScript you need to use the `.ts` source files in the `src/client`
directory directly.

## Example

```ts
import { Menu, MenuItem, BackMenuItem, InputType, InputMenuItem, CheckboxMenuItem, ListItem, ForwardMenuItem } from "./menu";

let menu = new Menu("Test Menu", "This is a test menu");
let otherMenu = new Menu(
    "Other Menu",
    "This is another menu",
    MenuColor.GREEN
);
otherMenu.addItem(new MenuItem("Menu Item", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 2", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 3", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 4", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 5", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 6", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 7", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 8", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 9", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 10", "mdi-key"));
otherMenu.addItem(new MenuItem("Menu Item 11", "mdi-key"));
otherMenu.addItem(new BackMenuItem(menu, "Go Back", "mdi-sitemap"));

menu.addItem(new MenuItem("Menu Item", "mdi-alert"));
menu.addItem(new CheckboxMenuItem("Checkbox Item", "mdi-crown"));
menu.addItem(
    new InputMenuItem(InputType.TEXT, "Text...", "Input Item", "mdi-text")
);
menu.addItem(
    new ListMenuItem(
        [
            new ListItem("Test 1", "test1"),
            new ListItem("Test test 123", "test2"),
            new ListItem("Test text very long yes", "test3"),
            new ListItem("0.1", "test4"),
        ],
        0,
        "List Item",
        "mdi-format-list-bulleted"
    )
);
menu.addItem(new ForwardMenuItem(otherMenu, "Next Menu", "mdi-sitemap"));

menu.onSelect((item) => {
    alt.log(`'${item.text}' Select`);
});
menu.onCheckboxChange((item, checked) => {
    alt.log(`'${item.text}' CheckboxChange: ${checked}`);
});
menu.onInputChange((item, input) => {
    alt.log(`'${item.text}' InputChange: ${input}`);
});
menu.onListItemChange((item, newItem, oldItem) => {
    alt.log(`'${item.text}' Old: ${oldItem.value} | New: ${newItem.value}`);
});
menu.onClose(() => {
    alt.log(`Closed menu`);
});

otherMenu.showParentMenuOnClose = false;
menu.show();
```
