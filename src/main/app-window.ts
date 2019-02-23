import { BrowserWindow, app, ipcMain } from 'electron';
import { resolve, join } from 'path';
import { platform } from 'os';
import mouseEvents from 'mouse-hooks';
import { windowManager, Window } from 'node-window-manager';
import { getFileIcon } from 'extract-file-icon';
import console = require('console');

export class ProcessWindow extends Window {
  public resizable = false;
  public maximizable = false;
  public minimizable = false;

  constructor(handle: number) {
    super(handle);

    this.resizable = this.isResizable();
    this.maximizable = this.isMaximizable();
    this.minimizable = this.isMinimizable();
  }

  public detach() {
    this.setResizable(this.resizable);
    this.setMaximizable(this.maximizable);
    this.setMinimizable(this.minimizable);
    this.setParent(null);
    this.show();
  }
}

export class AppWindow extends BrowserWindow {
  public windows: ProcessWindow[] = [];
  public selectedWindow: ProcessWindow;

  public ignoreDetaching = false;

  constructor() {
    super({
      frame: process.env.ENV === 'dev' || platform() === 'darwin',
      minWidth: 400,
      minHeight: 450,
      width: 900,
      height: 700,
      show: true,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        plugins: true,
        nodeIntegration: true,
      },
      icon: resolve(app.getAppPath(), 'static/app-icons/icon.png'),
    });

    process.on('uncaughtException', error => {
      console.error(error);
    });

    if (process.env.ENV === 'dev') {
      this.webContents.openDevTools({ mode: 'detach' });
      this.loadURL('http://localhost:4444/app.html');
    } else {
      this.loadURL(join('file://', app.getAppPath(), 'build/app.html'));
    }

    const updateBounds = () => {
      this.resizeWindow(this.selectedWindow);
    };

    this.on('move', updateBounds);
    this.on('resize', updateBounds);

    this.on('close', () => {
      for (const window of this.windows) {
        this.detachWindow(window);
      }
    });

    setInterval(() => {
      if (!this.selectedWindow) return;

      const bounds = this.getContentArea();
      const newBounds = this.selectedWindow.getBounds();

      if (bounds.x !== newBounds.x || bounds.y !== newBounds.y) {
        const { handle } = this.selectedWindow;
        this.detachWindow(this.selectedWindow);
        this.webContents.send('remove-tab', handle);
      }
    }, 100);

    ipcMain.on('select-window', (e: any, id: number) => {
      this.selectWindow(this.windows.find(x => x.handle === id));
    });

    ipcMain.on('detach-window', (e: any, id: number) => {
      this.detachWindow(this.windows.find(x => x.handle === id));
    });

    const handle = this.getNativeWindowHandle().readInt32LE(0);
    const currentWindow = new Window(handle);

    mouseEvents.on('mouse-up', async () => {
      const window = new ProcessWindow(windowManager.getActiveWindow().handle);
      const contentArea = this.getContentArea();
      const bounds = window.getBounds();

      if (
        !this.windows.find(x => x.handle === window.handle) &&
        window.handle !== handle &&
        bounds.x >= contentArea.x &&
        bounds.x <= contentArea.x + contentArea.width &&
        bounds.y >= contentArea.y - 42 &&
        bounds.y <= contentArea.y &&
        !this.ignoreDetaching
      ) {
        window.setParent(currentWindow);
        window.setMaximizable(false);
        window.setMinimizable(false);
        window.setResizable(false);

        this.ignoreDetaching = true;
        this.windows.push(window);
        this.selectWindow(window);

        const icon = getFileIcon(window.process.path);

        this.webContents.send('add-tab', {
          title: window.getTitle(),
          id: window.handle,
          icon,
        });

        setTimeout(() => {
          this.resizeWindow(window);
          this.ignoreDetaching = false;
        }, 50);
      }
    });
  }

  getContentArea() {
    const bounds = this.getContentBounds();

    bounds.y += 42;
    bounds.height -= 42;

    return bounds;
  }

  selectWindow(window: ProcessWindow) {
    if (!window) return;

    if (this.selectedWindow) {
      if (window.handle === this.selectedWindow.handle) return;

      this.selectedWindow.hide();
    }

    window.show();

    this.resizeWindow(window);

    this.selectedWindow = window;
  }

  resizeWindow(window: ProcessWindow) {
    if (!window) return;

    const newBounds = this.getContentArea();
    window.setBounds(newBounds);
  }

  detachWindow(window: ProcessWindow) {
    if (!window) return;

    this.selectedWindow = null;

    window.detach();

    this.windows = this.windows.filter(x => x.handle !== window.handle);
  }
}
