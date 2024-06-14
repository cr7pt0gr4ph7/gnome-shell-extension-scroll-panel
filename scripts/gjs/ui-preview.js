import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
const ByteArray = imports.byteArray; // legacy module without ESM equivalent

var UiPreview = GObject.registerClass(class extends Adw.Application {
    /**
     * @param {string} buildDirPath
     * @param {string} uiFileName
     * @param {string} uiTitle
     * @param {boolean} protect
     */
    constructor(buildDirPath, uiFileName, uiTitle, protect) {
        super();
        this.buildDirPath = buildDirPath;
        this.uiFileName = uiFileName;
        this.uiTitle = uiTitle ?? uiFileName;
        this.protect = protect;
    }

    vfunc_startup() {
        super.vfunc_startup();
        const metadataPath = `${this.buildDirPath}/metadata.json`;
        const [, metadataJson] = GLib.file_get_contents(metadataPath);
        const extensionMock = {
            imports,
            metadata: JSON.parse(ByteArray.toString(metadataJson)),
            dir: Gio.File.new_for_path(this.buildDirPath),
        };
        const uiBuilderModule = imports[this.uiFileName];
        const uiBuilder = new uiBuilderModule.UiBuilder(extensionMock);
        this.appWindow = new Adw.ApplicationWindow({
            'application': this,
            'can-focus': !this.protect,
            'can-target': !this.protect,
            'content': uiBuilder.bindDemo(),
            'title': this.uiTitle,
        });
    }

    vfunc_activate() {
        super.vfunc_activate();
        this.appWindow.present();
        this.appWindow.defaultHeight = 320;
        this.appWindow.defaultWidth = 320;
    }
});
