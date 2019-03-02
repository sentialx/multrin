import { BrowserWindow, app, ipcMain } from 'electron';
import { resolve, join } from 'path';
import { platform } from 'os';
import mouseEvents from 'mouse-hooks';
import { windowManager, Window } from 'node-window-manager';
import { getFileIcon } from 'extract-file-icon';
import console = require('console');
import { appWindow } from '.';

export class ProcessWindow extends Window {
  public resizable = false;
  public maximizable = false;
  public minimizable = false;

  public lastTitle: string;

  public opacity: number;

  constructor(handle: number) {
    super(handle);

    this.resizable = this.isResizable();
    this.maximizable = this.isMaximizable();
    this.minimizable = this.isMinimizable();
    this.opacity = this.getOpacity();
    this.opacity = this.opacity === 0 ? 1 : this.opacity;
  }

  public detach() {
    this.setResizable(this.resizable);
    this.setMaximizable(this.maximizable);
    this.setMinimizable(this.minimizable);
    this.setParent(null);

    setTimeout(() => {
      this.hide();
      this.show();
    }, 10);
  }
}

export class AppWindow extends BrowserWindow {
  public windows: ProcessWindow[] = [];
  public selectedWindow: ProcessWindow;

  public window: Window;

  public lastBounds: any;

  public detached = false;

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

    const handle = this.getNativeWindowHandle().readInt32LE(0);
    this.window = new Window(handle);

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

    let draggedWindow: ProcessWindow;
    let draggedIn = false;

    setInterval(() => {
      const bounds = this.getContentArea();
      const cursor = windowManager.getMousePoint();

      if (!this.isMinimized()) {
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

        if (this.selectedWindow) {
          const newBounds = this.selectedWindow.getBounds();

          if (bounds.x !== newBounds.x || bounds.y !== newBounds.y) {
            const window = this.selectedWindow;
            this.detachWindow(window);
            this.detached = true;

            this.webContents.send('remove-tab', window.handle);
          }
        }
      }

      if (
        draggedWindow &&
        !this.windows.find(x => x.handle === draggedWindow.handle)
      ) {
        const winBounds = draggedWindow.getBounds();
        if (
          !this.detached &&
          cursor.x >= bounds.x &&
          cursor.x <= bounds.x + bounds.width &&
          cursor.y >= bounds.y - 42 &&
          cursor.y <=
            bounds.y + (this.windows.length > 0 ? 0 : bounds.height) &&
          this.lastBounds &&
          (winBounds.x !== this.lastBounds.x ||
            winBounds.y !== this.lastBounds.y)
        ) {
          if (!draggedIn) {
            draggedWindow.setOpacity(draggedWindow.opacity / 1.5);

            const title = draggedWindow.getTitle();
            const icon = getFileIcon(draggedWindow.process.path);

            draggedWindow.lastTitle = title;

            this.webContents.send('add-tab', {
              id: draggedWindow.handle,
              title,
              icon,
            });

            draggedIn = true;
          }
        } else if (draggedIn) {
          draggedWindow.setOpacity(draggedWindow.opacity);

          this.webContents.send('remove-tab', draggedWindow.handle);

          draggedIn = false;
        }
      }
    }, 100);

    ipcMain.on('select-window', (e: any, id: number) => {
      this.selectWindow(this.windows.find(x => x.handle === id));
    });

    ipcMain.on('detach-window', (e: any, id: number) => {
      this.detachWindow(this.windows.find(x => x.handle === id));
    });

    windowManager.on('window-activated', (window: Window) => {
      this.webContents.send('select-tab', window.handle);
    });

    mouseEvents.on('mouse-down', () => {
      if (this.isMinimized()) return;

      setTimeout(() => {
        draggedWindow = new ProcessWindow(
          windowManager.getActiveWindow().handle,
        );

        if (draggedWindow.handle === handle) {
          draggedWindow = null;
          return;
        }

        this.lastBounds = draggedWindow.getBounds();
      }, 50);
    });

    mouseEvents.on('mouse-up', async data => {
      if (draggedWindow && !this.isMinimized()) {
        const contentArea = this.getContentArea();
        const bounds = draggedWindow.getBounds();

        if (
          draggedWindow &&
          !this.detached &&
          !this.windows.find(x => x.handle === draggedWindow.handle) &&
          data.x >= contentArea.x &&
          data.x <= contentArea.x + contentArea.width &&
          data.y >= contentArea.y - 42 &&
          data.y <=
            contentArea.y +
              (this.windows.length > 0 ? 0 : contentArea.height) &&
          this.lastBounds &&
          (bounds.x !== this.lastBounds.x || bounds.y !== this.lastBounds.y)
        ) {
          const win = draggedWindow;

          win.setParent(this.window);
          win.setMaximizable(false);
          win.setMinimizable(false);
          win.setResizable(false);
          win.setOpacity(win.opacity);

          this.windows.push(win);

          setTimeout(() => {
            this.selectWindow(win);
          }, 50);
        }
      }

      draggedWindow = null;
      this.lastBounds = null;
      this.detached = false;
    });
  }

  getContentArea() {
    const bounds = this.getContentBounds();

    bounds.y += 42;
    bounds.height -= 42;

    const sf = windowManager.getScaleFactor(
      windowManager.getMonitorFromWindow(this.window),
    );

    bounds.x *= sf;
    bounds.y *= sf;
    bounds.width *= sf;
    bounds.height *= sf;

    bounds.x = Math.round(bounds.x);
    bounds.y = Math.round(bounds.y);
    bounds.width = Math.round(bounds.width);
    bounds.height = Math.round(bounds.height);

    return bounds;
  }

  selectWindow(window: ProcessWindow) {
    if (!window) return;

    if (this.selectedWindow) {
      if (window.handle === this.selectedWindow.handle) return;

      this.selectedWindow.hide();
    }

    window.show();

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
