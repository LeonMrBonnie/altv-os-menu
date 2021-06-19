import uuid from "./uuid";
import * as alt from "alt-client";
import { playSoundFrontend, getSoundId, releaseSoundId } from "natives";

const WebManager = new alt.WebView("http://assets/browser/dist/index.html");

enum MenuItemType {
    NORMAL = "Item",
    BACK = "BackItem",
    FORWARD = "ForwardItem",
    CHECKBOX = "CheckboxItem",
    INPUT = "InputItem",
    LIST = "ListItem",
}

export enum MenuColor {
    WHITE = "#6d737d",
    PURPLE = "#6666ff",
    ORANGE = "#e59646",
    PINK = "#DE73FF",
    BLUE = "#528BFF",
    LIGHTBLUE = "#4DC4FF",
    RED = "#ff4c4c",
    YELLOW = "#fdc30f",
    GREEN = "#8CC265",
    DARKGREEN = "#458823",
}

export enum InputType {
    TEXT = "text",
    NUMBER = "number",
    EMAIL = "email",
}

type MenuSelectHandler = (item: MenuItem, index: number) => void;
type MenuCloseHandler = () => void;
type MenuShowHandler = () => void;
type CheckboxChangeHandler = (item: CheckboxMenuItem, checked: boolean) => void;
type InputChangeHandler = (item: InputMenuItem, newInput: string) => void;
type ListChangeHandler = (
    item: ListMenuItem,
    newSelected: ListItem,
    oldSelected: ListItem
) => void;

type MenuItems = {
    [prop: string]: MenuItem;
};

export class Menu {
    static current: Menu | null = null;

    visible = false;
    private _title: string;
    private _subtitle: string;
    private _color: string;
    private _items: MenuItems;
    private _parentMenu: Menu | null = null;
    private _showParentMenuOnClose: boolean;

    constructor(
        title: string,
        subtitle: string,
        color: MenuColor | string = MenuColor.WHITE
    ) {
        this._title = title;
        this._subtitle = subtitle;
        this._color = color;
        this._items = {};
        this._showParentMenuOnClose = true;
    }

    addItem(item: MenuItem) {
        this._items[item.id] = item;
        if (this.visible) WebManager.emit("menu:addItem", item.getJSON());

        if (item instanceof BackMenuItem)
            this._parentMenu = (item as BackMenuItem).menu;
        else if (item instanceof ForwardMenuItem)
            (item as ForwardMenuItem).menu._parentMenu = this;
    }
    removeItem(item: MenuItem) {
        let found = this.items[item.id];
        if (!found) return;
        delete this._items[item.id];
        if (this.visible) WebManager.emit("menu:removeItem", found.id);
    }
    hasItem(item: MenuItem): boolean {
        return this.items.hasOwnProperty(item.id);
    }
    clear() {
        this._items = {};
        WebManager.emit("menu:clear");
    }
    show() {
        if (Menu.current === this) return;
        if (Menu.current) Menu.current.hide();

        WebManager.emit("menu:setTitle", this.title);
        WebManager.emit("menu:setSubtitle", this.subtitle);
        WebManager.emit("menu:setBgColor", this.color);
        for (let itemId in this.items)
            WebManager.emit("menu:addItem", this.items[itemId].getJSON());
        WebManager.emit("menu:toggle", true);
        WebManager.focus();
        this.visible = true;
        Menu.current = this;

        this.showHandlers.forEach((handler) => handler());
    }
    hide() {
        if (Menu.current !== this || !this.visible) return;

        WebManager.emit("menu:toggle", false);
        WebManager.emit("menu:clear");
        WebManager.unfocus();
        this.visible = false;
        Menu.current = null;

        this.closeHandlers.forEach((handler) => handler());
    }
    close() {
        if (this.parentMenu && this.showParentMenuOnClose)
            this.parentMenu.show();
        else this.hide();
    }

    private _selectHandlers: MenuSelectHandler[] = [];
    onSelect(handler: MenuSelectHandler) {
        this._selectHandlers.push(handler);
    }
    get selectHandlers() {
        return this._selectHandlers;
    }

    private _closeHandlers: MenuCloseHandler[] = [];
    onClose(handler: MenuCloseHandler) {
        this._closeHandlers.push(handler);
    }
    get closeHandlers() {
        return this._closeHandlers;
    }

    private _showHandlers: MenuShowHandler[] = [];
    onShow(handler: MenuShowHandler) {
        this._showHandlers.push(handler);
    }
    get showHandlers() {
        return this._showHandlers;
    }

    private _checkboxChangeHandlers: CheckboxChangeHandler[] = [];
    onCheckboxChange(handler: CheckboxChangeHandler) {
        this._checkboxChangeHandlers.push(handler);
    }
    get checkboxChangeHandlers() {
        return this._checkboxChangeHandlers;
    }

    private _inputChangeHandlers: InputChangeHandler[] = [];
    onInputChange(handler: InputChangeHandler) {
        this._inputChangeHandlers.push(handler);
    }
    get inputChangeHandlers() {
        return this._inputChangeHandlers;
    }

    private _listChangeHandlers: ListChangeHandler[] = [];
    onListItemChange(handler: ListChangeHandler) {
        this._listChangeHandlers.push(handler);
    }
    get listChangeHandlers() {
        return this._listChangeHandlers;
    }

    get items() {
        return this._items;
    }
    get itemsCount() {
        return Object.keys(this._items).length;
    }
    get title() {
        return this._title;
    }
    set title(val) {
        this._title = val;
        WebManager.emit("menu:setTitle", val);
    }
    get subtitle() {
        return this._subtitle;
    }
    set subtitle(val) {
        this._subtitle = val;
        WebManager.emit("menu:setSubtitle", val);
    }
    get color() {
        return this._color;
    }
    set color(val) {
        this._color = val;
        WebManager.emit("menu:setBgColor", val);
    }
    get parentMenu() {
        return this._parentMenu;
    }
    get showParentMenuOnClose() {
        return this._showParentMenuOnClose;
    }
    set showParentMenuOnClose(val) {
        this._showParentMenuOnClose = val;
    }

    getActiveInput(): InputMenuItem | null {
        let item: InputMenuItem;
        for (let itemId in this.items) {
            item = this.items[itemId] as InputMenuItem;
            if (item instanceof InputMenuItem && item.inputActive) return item;
        }
        return null;
    }
}

export class MenuItem {
    private _id: string;
    private _text: string;
    private _icon?: string;
    private _type?: MenuItemType;
    private _data?: any;
    private _disabled: boolean;

    constructor(
        text: string,
        icon?: string,
        data?: any,
        type: MenuItemType = MenuItemType.NORMAL
    ) {
        this._id = uuid();
        this._text = text;
        this._icon = icon;
        this._data = data;
        this._type = type;
        this._disabled = false;
    }

    get id() {
        return this._id;
    }
    get text() {
        return this._text;
    }
    set text(val) {
        this._text = val;
        WebManager.emit("menu:setItemText", this.id, val);
    }
    get icon() {
        return this._icon;
    }
    set icon(val) {
        this._icon = val;
        WebManager.emit("menu:setItemIcon", this.id, val);
    }
    get data() {
        return this._data;
    }
    set data(val) {
        this._data = val;
    }
    get rightText(): string {
        return this.data?.rightText;
    }
    set rightText(val) {
        if (this.data) this.data.rightText = val;
        WebManager.emit("menu:setItemRightText", this.id, val);
    }
    get rightIcon(): string {
        return this.data?.rightIcon;
    }
    set rightIcon(val) {
        if (this.data) this.data.rightIcon = val;
        WebManager.emit("menu:setItemRightIcon", this.id, val);
    }
    get disabled(): boolean {
        return this._disabled;
    }
    set disabled(val) {
        this._disabled = val;
        WebManager.emit("menu:setItemDisabled", this.id, val);
    }
    get type() {
        return this._type;
    }

    select() {
        if (this.disabled) return false;
        return true;
    }

    getJSON() {
        return {
            id: this.id,
            text: this.text,
            type: this.type,
            icon: this.icon,
            rightText: this.rightText,
            rightIcon: this.rightIcon,
            disabled: this.disabled,
        };
    }

    static onSelect(itemId: string, index: number) {
        let menu = Menu.current;
        if (!menu) return;
        let item = menu.items[itemId];
        if (!item) return;
        let select = item.select();
        if (!select) return;
        if (item instanceof CheckboxMenuItem)
            menu.checkboxChangeHandlers.forEach((handler) =>
                handler(
                    item as CheckboxMenuItem,
                    (item as CheckboxMenuItem).checked
                )
            );
        else menu.selectHandlers.forEach((handler) => handler(item, index));
    }
}

export class CheckboxMenuItem extends MenuItem {
    private _checked: boolean;

    constructor(
        text: string,
        icon?: string,
        checked: boolean = false,
        data?: any
    ) {
        super(text, icon, data, MenuItemType.CHECKBOX);

        this._checked = checked;
    }

    get checked() {
        return this._checked;
    }
    set checked(val) {
        this._checked = val;
        WebManager.emit("menu:setItemChecked", this.id, val);
    }

    select() {
        if (!super.select()) return false;
        this.checked = !this.checked;
        return true;
    }

    getJSON() {
        return {
            ...super.getJSON(),
            checked: this.checked,
        };
    }
}

export class BackMenuItem extends MenuItem {
    private _menu: Menu;

    constructor(menu: Menu, text: string, icon?: string, data?: any) {
        super(text, icon, data, MenuItemType.BACK);
        this._menu = menu;
    }

    get menu() {
        return this._menu;
    }
    set menu(val) {
        this._menu = val;
    }

    select() {
        if (!super.select()) return false;
        this._menu.show();
        return true;
    }
}

export class ForwardMenuItem extends MenuItem {
    private _menu: Menu;

    constructor(menu: Menu, text: string, icon?: string, data?: any) {
        super(text, icon, data, MenuItemType.FORWARD);
        this._menu = menu;
    }

    get menu() {
        return this._menu;
    }
    set menu(val) {
        this._menu = val;
    }

    select() {
        if (!super.select()) return false;
        this._menu.show();
        return true;
    }
}

export class InputMenuItem extends MenuItem {
    private _inputType: InputType;
    private _input: string;
    private _inputActive: boolean;
    private _placeholder: string;

    constructor(
        inputType: InputType,
        placeholder: string,
        text: string,
        icon?: string,
        data?: any
    ) {
        super(text, icon, data, MenuItemType.INPUT);
        this._inputType = inputType;
        this._input = "";
        this._inputActive = false;
        this._placeholder = placeholder;
    }

    select() {
        if (!super.select()) return false;
        this.inputActive = !this.inputActive;

        if (this.inputActive) WebManager.focus();
        else WebManager.unfocus();
        alt.toggleGameControls(!this.inputActive);
        return true;
    }

    get inputActive() {
        return this._inputActive;
    }
    set inputActive(val) {
        this._inputActive = val;
        WebManager.emit("menu:focusInput", this.id, val);
    }
    get inputType() {
        return this._inputType;
    }
    set inputType(val) {
        this._inputType = val;
        WebManager.emit("menu:setInputType", this.id, val);
    }
    get input() {
        return this._input;
    }
    set input(val) {
        this._input = val;
        WebManager.emit("menu:setInput", this.id, val);
    }
    get placeholder() {
        return this._placeholder;
    }
    set placeholder(val) {
        this._placeholder = val;
        WebManager.emit("menu:setInputPlaceholder", this.id, val);
    }

    getJSON() {
        return {
            ...super.getJSON(),
            input: this.input,
            inputType: this.inputType,
            placeholder: this.placeholder,
        };
    }

    static onSetInput(itemId: string, input: string) {
        let menu = Menu.current;
        if (!menu) return;
        let item = menu.items[itemId] as InputMenuItem;
        if (!item) return;
        item._input = input;
        menu.inputChangeHandlers.forEach((handler) =>
            handler(item, item.input)
        );
    }
}

export class ListMenuItem extends MenuItem {
    private _listItems: ListItem[];
    private _selectedItem: number = 0;

    constructor(
        listItems: ListItem[],
        selectedIndex: number,
        text: string,
        icon?: string,
        data?: any
    ) {
        super(text, icon, data, MenuItemType.LIST);
        if (listItems.length === 0)
            throw new Error("ListItems has no elements");
        this._listItems = listItems;
        this.selectedItem = selectedIndex;
    }

    get listItems() {
        return this._listItems;
    }
    get selectedItem() {
        return this._selectedItem;
    }
    set selectedItem(val) {
        this._selectedItem = val;
        WebManager.emit("menu:setSelectedListItem", this.id, val);
    }

    getJSON() {
        return {
            ...super.getJSON(),
            items: this.listItems.map((item) => ({
                text: item.text,
                value: item.value,
            })),
            selectedItem: this.selectedItem,
        };
    }

    static onSetListItem(itemId: string, index: number) {
        let menu = Menu.current;
        if (!menu) return;
        let item = menu.items[itemId] as ListMenuItem;
        if (!item) return;
        let oldItem = item.listItems[item.selectedItem];
        item._selectedItem = index;
        let newItem = item.listItems[item.selectedItem];
        menu.listChangeHandlers.forEach((handler) =>
            handler(item, newItem, oldItem)
        );
    }
}

export class ListItem {
    private _text: string;
    private _value: string;

    constructor(text: string, value: string) {
        this._text = text;
        this._value = value;
    }

    get text() {
        return this._text;
    }
    get value() {
        return this._value;
    }
}

// Web Events
WebManager.on("menu:select", MenuItem.onSelect);
WebManager.on("menu:setInput", InputMenuItem.onSetInput);
WebManager.on("menu:setListItem", ListMenuItem.onSetListItem);

// Handle keys
alt.on("keyup", (key) => {
    let menu = Menu.current;
    if (!menu) return;
    let sound = getSoundId();
    switch (key) {
        // ArrowLeft
        case 37: {
            WebManager.emit("menu:moveLeft");
            playSoundFrontend(
                sound,
                "NAV_LEFT_RIGHT",
                "HUD_FRONTEND_DEFAULT_SOUNDSET",
                true
            );
            break;
        }
        // ArrowUp
        case 38: {
            WebManager.emit("menu:moveUp");
            playSoundFrontend(
                sound,
                "NAV_UP_DOWN",
                "HUD_FRONTEND_DEFAULT_SOUNDSET",
                true
            );
            let input = menu.getActiveInput();
            if (input) input.select(); // Unfocus the input
            break;
        }
        // ArrowRight
        case 39: {
            WebManager.emit("menu:moveRight");
            playSoundFrontend(
                sound,
                "NAV_LEFT_RIGHT",
                "HUD_FRONTEND_DEFAULT_SOUNDSET",
                true
            );
            break;
        }
        // ArrowDown
        case 40: {
            WebManager.emit("menu:moveDown");
            playSoundFrontend(
                sound,
                "NAV_UP_DOWN",
                "HUD_FRONTEND_DEFAULT_SOUNDSET",
                true
            );
            let input = menu.getActiveInput();
            if (input) input.select(); // Unfocus the input
            break;
        }
        // Enter
        case 13: {
            WebManager.emit("menu:select");
            playSoundFrontend(
                sound,
                "SELECT",
                "HUD_FRONTEND_DEFAULT_SOUNDSET",
                true
            );
            break;
        }
        // Escape
        case 8: {
            let input = menu.getActiveInput();
            if (input) return; // Don't close on backspace when input is open
            Menu.current?.close();
            playSoundFrontend(
                sound,
                "BACK",
                "HUD_FRONTEND_DEFAULT_SOUNDSET",
                true
            );
            break;
        }
    }
    releaseSoundId(sound);
});
