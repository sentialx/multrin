import { BrowserWindow, app, screen, globalShortcut, ipcMain } from 'electron';
import { resolve, join } from 'path';
import { platform } from 'os';
import { windowManager, Window } from 'node-window-manager';
import console = require('console');
import { TOOLBAR_HEIGHT } from '~/renderer/app/constants/design';
import { ProcessWindow } from './process-window';

const iohook = require('iohook');

const containsPoint = (bounds: any, point: any) => {
  return (
    point.x >= bounds.x &&
    point.y >= bounds.y &&
    point.x <= bounds.x + bounds.width &&
    point.y <= bounds.y + bounds.height
  );
};

export class AppWindow extends BrowserWindow {
  public windows: ProcessWindow[] = [];
  public selectedWindow: ProcessWindow;

  public window: Window;
  public draggedWindow: ProcessWindow;

  public draggedIn = false;
  public detached = false;
  public isMoving = false;
  public isUpdatingContentBounds = false;
  public willAttachWindow = false;

  public interval: any;

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

    iohook.start();

    const { x, y } = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint({ x, y });
    this.setPosition(currentDisplay.workArea.x, currentDisplay.workArea.y);
    this.center();

    process.on('uncaughtException', error => {
      console.error(error);
    });

    if (process.env.ENV === 'dev') {
      this.webContents.openDevTools({ mode: 'detach' });
      this.loadURL('http://localhost:4444/app.html');
    } else {
      this.loadURL(join('file://', app.getAppPath(), 'build/app.html'));
    }

    if (platform() === 'win32' || platform() === 'darwin') {
      this.activateWindowCapturing();
    }
  }

  public activateWindowCapturing() {
    const updateBounds = () => {
      this.isMoving = true;

      if (!this.isUpdatingContentBounds) {
        this.resizeWindow(this.selectedWindow);
      }
    };

    this.on('move', updateBounds);
    this.on('resize', updateBounds);
    this.on('focus', () => {
      if (this.selectedWindow) this.selectedWindow.bringToTop();
    });

    this.on('close', () => {
      clearInterval(this.interval);

      for (const window of this.windows) {
        window.show();
        this.detachWindow(window);
      }
    });

    this.interval = setInterval(this.intervalCallback, 100);

    ipcMain.on('select-window', (e: any, id: number) => {
      this.selectWindow(this.windows.find(x => x.handle === id));
    });

    ipcMain.on('detach-window', (e: any, id: number) => {
      this.detachWindow(this.windows.find(x => x.handle === id));
    });

    windowManager.on('window-activated', (window: Window) => {
      this.webContents.send('select-tab', window.handle);

      if (window.process.id === process.pid && !this.window) {
        this.window = window;
      }

      if (
        window.handle === this.window.handle ||
        (this.selectedWindow && window.handle === this.selectedWindow.handle)
      ) {
        if (!globalShortcut.isRegistered('CmdOrCtrl+Tab')) {
          globalShortcut.register('CmdOrCtrl+Tab', () => {
            this.webContents.send('next-tab');
          });
        }
      } else if (globalShortcut.isRegistered('CmdOrCtrl+Tab')) {
        globalShortcut.unregister('CmdOrCtrl+Tab');
      }
    });

    iohook.on('mousedown', e => {
      if (this.isMinimized()) return;

      setTimeout(() => {
        this.draggedWindow = new ProcessWindow(
          windowManager.getActiveWindow().handle,
        );

        if (this.draggedWindow.handle === this.window.handle) {
          this.draggedWindow = null;
          return;
        }
      }, 50);
    });

    iohook.on('mouseup', async data => {
      if (this.selectedWindow && !this.isMoving) {
        const bounds = this.selectedWindow.getBounds();
        const { lastBounds } = this.selectedWindow;

        if (
          !this.isMaximized() &&
          (bounds.width !== lastBounds.width ||
            bounds.height !== lastBounds.height)
        ) {
          this.isUpdatingContentBounds = true;

          clearInterval(this.interval);

          this.selectedWindow.lastBounds = bounds;

          this.setContentBounds({
            width: bounds.width,
            height: bounds.height + TOOLBAR_HEIGHT,
            x: bounds.x,
            y: bounds.y - TOOLBAR_HEIGHT - 1,
          });

          this.interval = setInterval(this.intervalCallback, 100);

          this.isUpdatingContentBounds = false;
        }
      }

      this.isMoving = false;

      if (this.draggedWindow && this.willAttachWindow) {
        const win = this.draggedWindow;

        win.setOwner(this.window);

        this.windows.push(win);

        this.willAttachWindow = false;

        setTimeout(() => {
          this.selectWindow(win);
        }, 50);
      }

      this.draggedWindow = null;
      this.detached = false;
    });
  }

  intervalCallback = () => {
    if (this.isMoving) return;

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
        const contentBounds = this.getContentArea();
        const bounds = this.selectedWindow.getBounds();
        const { lastBounds } = this.selectedWindow;

        if (
          (contentBounds.x !== bounds.x || contentBounds.y !== bounds.y) &&
          (bounds.width === lastBounds.width &&
            bounds.height === lastBounds.height)
        ) {
          const window = this.selectedWindow;
          this.detachWindow(window);
          this.detached = true;
        }
      }
    }

    if (
      !this.isMinimized() &&
      this.draggedWindow &&
      !this.windows.find(x => x.handle === this.draggedWindow.handle)
    ) {
      const winBounds = this.draggedWindow.getBounds();
      const { lastBounds } = this.draggedWindow;
      const contentBounds = this.getContentArea();
      const cursor = screen.getCursorScreenPoint();

      cursor.y = winBounds.y;

      contentBounds.y -= TOOLBAR_HEIGHT;

      if (this.windows.length > 0) {
        contentBounds.height = 2 * TOOLBAR_HEIGHT;
      }

      if (
        !this.detached &&
        containsPoint(contentBounds, cursor) &&
        (winBounds.x !== lastBounds.x || winBounds.y !== lastBounds.y)
      ) {
        if (!this.draggedIn) {
          const title = this.draggedWindow.getTitle();
          app.getFileIcon(this.draggedWindow.process.path, (err, icon) => {
            if (err) console.error(err);

            this.draggedWindow.lastTitle = title;

            this.webContents.send('add-tab', {
              id: this.draggedWindow.handle,
              title,
              icon: icon.toPNG(),
            });

            this.draggedIn = true;
            this.willAttachWindow = true;
          });
        }
      } else if (this.draggedIn && !this.detached) {
        this.webContents.send('remove-tab', this.draggedWindow.handle);

        this.draggedIn = false;
        this.willAttachWindow = false;
      }
    }
  };

  getContentArea() {
    const bounds = this.getContentBounds();

    bounds.y += TOOLBAR_HEIGHT;
    bounds.height -= TOOLBAR_HEIGHT;

    return bounds;
  }

  selectWindow(window: ProcessWindow) {
    if (!window) return;

    if (this.selectedWindow) {
      if (window.handle === this.selectedWindow.handle) {
        return;
      }

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
    window.lastBounds = newBounds;

    const bounds = window.getBounds();

    if (bounds.width > newBounds.width || bounds.height > newBounds.height) {
      this.setContentSize(bounds.width, bounds.height + TOOLBAR_HEIGHT);
      this.setMinimumSize(bounds.width, bounds.height + TOOLBAR_HEIGHT);
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
