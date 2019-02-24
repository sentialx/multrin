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

  public lastTitle: string;

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

  public lastBounds: any;
  public detachedWindow: Window;

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
      if (this.isMinimized()) return;

      for (const window of this.windows) {
        const title = window.getTitle();
        if (window.lastTitle !== title) {
          this.webContents.send('update-tab-title', {
            id: window.handle,
            title,
          });
          window.lastTitle = title;
        }

        if (!window.isWindow()) {
          this.detachWindow(window);
          this.webContents.send('remove-tab', window.handle);
        }
      }

      if (!this.selectedWindow) return;

      const bounds = this.getContentArea();
      const newBounds = this.selectedWindow.getBounds();

      if (bounds.x !== newBounds.x || bounds.y !== newBounds.y) {
        const window = this.selectedWindow;
        this.detachWindow(window);

        this.detachedWindow = window;

        setTimeout(() => {
          window.bringToTop();
        }, 50);

        this.webContents.send('remove-tab', window.handle);
      }
    }, 100);

    ipcMain.on('select-window', (e: any, id: number) => {
      this.selectWindow(this.windows.find(x => x.handle === id));

      if (this.detachedWindow) {
        const win = this.detachedWindow;
        setTimeout(() => {
          win.bringToTop();
        }, 50);
        this.detachedWindow = null;
      }
    });

    ipcMain.on('detach-window', (e: any, id: number) => {
      this.detachWindow(this.windows.find(x => x.handle === id));
    });

    const handle = this.getNativeWindowHandle().readInt32LE(0);
    const currentWindow = new Window(handle);

    mouseEvents.on('mouse-down', () => {
      if (this.isMinimized()) return;

      const window = new ProcessWindow(windowManager.getActiveWindow().handle);
      this.lastBounds = window.getBounds();
    });

    mouseEvents.on('mouse-up', async data => {
      if (this.isMinimized()) return;

      const window = new ProcessWindow(windowManager.getActiveWindow().handle);
      const contentArea = this.getContentArea();
      const bounds = window.getBounds();

      if (
        !this.windows.find(x => x.handle === window.handle) &&
        window.handle !== handle &&
        data.x >= contentArea.x &&
        data.x <= contentArea.x + contentArea.width &&
        data.y >= contentArea.y - 42 &&
        data.y <= contentArea.y + contentArea.height &&
        this.lastBounds &&
        (bounds.x !== this.lastBounds.x || bounds.y !== this.lastBounds.y)
      ) {
        window.setParent(currentWindow);
        window.setMaximizable(false);
        window.setMinimizable(false);
        window.setResizable(false);

        this.windows.push(window);

        const icon = getFileIcon(window.process.path);

        setTimeout(() => {
          const title = window.getTitle();
          window.lastTitle = title;

          this.webContents.send('add-tab', {
            id: window.handle,
            title,
            icon,
          });

          this.selectWindow(window);
        }, 50);
      }

      this.lastBounds = null;
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

    this.lastBounds = null;
    this.selectedWindow = window;

    this.resizeWindow(window);
  }

  resizeWindow(window: ProcessWindow) {
    if (!window || this.isMinimized()) return;

    const newBounds = this.getContentArea();

    window.setBounds(newBounds);

    const bounds = window.getBounds();

    if (bounds.width > newBounds.width || bounds.height > newBounds.height) {
      this.setContentSize(bounds.width, bounds.height + 42);
      this.setMinimumSize(bounds.width, bounds.height + 42);
    }
  }

  detachWindow(window: ProcessWindow) {
    if (!window) return;

    if (this.selectedWindow === window) {
      this.selectedWindow = null;
    }

    window.detach();

    this.windows = this.windows.filter(x => x.handle !== window.handle);
  }
}
