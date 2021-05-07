#!/usr/bin/env gjs
imports.gi.versions.Gtk = '4.0';
const { GObject, Gtk } = imports.gi;

const UiPreview = GObject.registerClass(
class UiPreview extends Gtk.Application {
    vfunc_startup() {
        super.vfunc_startup();
        const file = imports.gi.GLib.getenv('UI');
        const uiBuilder = new imports.prefs.UiBuilder(`${file}.ui`);
        this.appWindow = new Gtk.ApplicationWindow({
            application: this,
            child: uiBuilder.widget,
            title: `Preview ${file}.ui`,
        });
    }

    vfunc_activate() {
        super.vfunc_activate();
        this.appWindow.present();
    }
});

const app = new UiPreview();
app.run([]);