import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';
import {SwitcherPopup, SwitcherList} from 'resource:///org/gnome/shell/ui/switcherPopup.js';
import {WindowIcon} from 'resource:///org/gnome/shell/ui/altTab.js';

/**
 * Same as built-in AppIconMode from altTab.js. Copied here because the original
 * is not exported, and not accessible anymore since switching to ES Modules.
 * See original sources at {@link https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/master/js/ui/altTab.js}.
 */
const AppIconMode = {
    THUMBNAIL_ONLY: 1,
    APP_ICON_ONLY: 2,
    BOTH: 3,
};

/**
 * Stable-sequenced window switcher popup.
 * Based on built-in AltTab, but in opposite to it does not switch windows,
 * just shows them and highlights the active one.
 * See original sources at {@link https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/master/js/ui/altTab.js}.
 */
export var WindowSwitcherPopup = GObject.registerClass(
    class _WindowSwitcherPopup extends SwitcherPopup {
        _init(windows) {
            super._init();
            this.reactive = false;
            this.selectedIndex = 0;
            this._visibilityTimeoutHandle = 0;

            // These fields are defined and used by parent class, do not rename them.
            this._switcherList = new WindowSwitcher(windows, AppIconMode.BOTH);
            this._items = this._switcherList.icons;
            this.add_actor(this._switcherList);
        }

        /**
         * Try display switcher.
         *
         * @param {number} activeIndex - 0-based index of element to highlight.
         * @param {number} timeout - Timeout (in milliseconds) before hiding of
         * the switcher.
         * @returns {boolean} - Whether switcher was successfully displayed.
         */
        tryDisplay(activeIndex, timeout) {
            this.selectedIndex = activeIndex;
            if (this._items.length === 0) {
                return false;
            } else {
                this._resetVisibilityTimeout(timeout);
                this._switcherList.highlight(activeIndex);
                return true;
            }
        }

        _resetVisibilityTimeout(timeout) {
            this.visible = true;

            if (this._visibilityTimeoutHandle !== 0) {
                GLib.source_remove(this._visibilityTimeoutHandle);
            }

            this._visibilityTimeoutHandle = GLib.timeout_add(
                GLib.PRIORITY_DEFAULT,
                timeout, // ms
                () => {
                    this.destroy();
                    this._visibilityTimeoutHandle = 0;
                    return GLib.SOURCE_REMOVE;
                }
            );
        }
    }
);

/**
 * Same as built-in WindowSwitcher from altTab.js (minus some difference in
 * how imports are referenced). Copied here because the original is not exported,
 * and not accessible anymore since switching to ES Modules.
 * See original sources at {@link https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/master/js/ui/altTab.js}.
 */
const WindowSwitcher = GObject.registerClass(
    class WindowSwitcher extends SwitcherList {
        _init(windows, mode) {
            super._init(true);

            this._label = new St.Label({
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
            });
            this.add_child(this._label);

            this.windows = windows;
            this.icons = [];

            for (let i = 0; i < windows.length; i++) {
                let win = windows[i];
                let icon = new WindowIcon(win, mode);

                this.addItem(icon, icon.label);
                this.icons.push(icon);

                icon.window.connectObject('unmanaged',
                    window => this._removeWindow(window), this);
            }

            this.connect('destroy', this._onDestroy.bind(this));
        }

        _onDestroy() {
            this.icons.forEach(
                icon => icon.window.disconnectObject(this));
        }

        vfunc_get_preferred_height(forWidth) {
            let [minHeight, natHeight] = super.vfunc_get_preferred_height(forWidth);

            let spacing = this.get_theme_node().get_padding(St.Side.BOTTOM);
            let [labelMin, labelNat] = this._label.get_preferred_height(-1);

            minHeight += labelMin + spacing;
            natHeight += labelNat + spacing;

            return [minHeight, natHeight];
        }

        vfunc_allocate(box) {
            let themeNode = this.get_theme_node();
            let contentBox = themeNode.get_content_box(box);
            const labelHeight = this._label.height;
            const totalLabelHeight =
                labelHeight + themeNode.get_padding(St.Side.BOTTOM);

            box.y2 -= totalLabelHeight;
            super.vfunc_allocate(box);

            // Hooking up the parent vfunc will call this.set_allocation() with
            // the height without the label height, so call it again with the
            // correct size here.
            box.y2 += totalLabelHeight;
            this.set_allocation(box);

            const childBox = new Clutter.ActorBox();
            childBox.x1 = contentBox.x1;
            childBox.x2 = contentBox.x2;
            childBox.y2 = contentBox.y2;
            childBox.y1 = childBox.y2 - labelHeight;
            this._label.allocate(childBox);
        }

        highlight(index, justOutline) {
            super.highlight(index, justOutline);

            this._label.set_text(index === -1 ? '' : this.icons[index].label.text);
        }

        _removeWindow(window) {
            let index = this.icons.findIndex(icon => {
                return icon.window === window;
            });
            if (index === -1) {
                return;
            }

            this.icons.splice(index, 1);
            this.removeItem(index);
        }
    });
