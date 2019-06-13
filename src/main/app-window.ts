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

  public draggedWindow: ProcessWindow;

  public draggedIn = false;
  public detached = false;
  public willAttachWindow = false;
  public isMoving = false;
  public isUpdatingContentBounds = false;

  public interval: any;

  constructor() {
    super({
      frame: process.env.ENV === 'dev' || platform() === 'darwin',
      width: 900,
      height: 700,
      show: true,
      fullscreenable: false,
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

      if (platform() === 'darwin') {
        for (const win of this.windows) {
          if (
            win &&
            ((this.selectedWindow !== win && this.isUpdatingContentBounds) ||
              !this.isUpdatingContentBounds)
          ) {
            this.resizeWindow(win);
          }
        }
      } else if (!this.isUpdatingContentBounds) {
        this.resizeWindow(this.selectedWindow);
      }
    };

    this.on('move', updateBounds);
    this.on('resize', updateBounds);

    ipcMain.on('focus', () => {
      if (this.selectedWindow) this.selectedWindow.bringToTop();
    });

    this.on('focus', () => {
      if (this.selectedWindow && this.isMoving) {
        this.selectedWindow.bringToTop();
      }
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
      this.selectWindow(this.windows.find(x => x.id === id));
    });

    ipcMain.on('detach-window', (e: any, id: number) => {
      this.detachWindow(this.windows.find(x => x.id === id));
    });

    windowManager.on('window-activated', (window: Window) => {
      if (
        this.isFocused() ||
        (this.selectedWindow && window.id === this.selectedWindow.id)
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

    iohook.on('mousedown', () => {
      if (this.isMinimized()) return;

      setTimeout(() => {
        if (this.isFocused()) {
          this.draggedWindow = null;
          return;
        }
        this.draggedWindow = new ProcessWindow(
          windowManager.getActiveWindow().id,
        );
      }, 50);
    });

    iohook.on('mousedrag', (e: any) => {
      if (
        this.draggedWindow &&
        this.selectedWindow &&
        this.draggedWindow.id === this.selectedWindow.id
      ) {
        this.isUpdatingContentBounds = true;
        const bounds = this.selectedWindow.getBounds();

        if (!this.isMaximized()) {
          this.selectedWindow.lastBounds = bounds;

          this.setContentBounds({
            width: bounds.width,
            height: bounds.height + TOOLBAR_HEIGHT,
            x: bounds.x,
            y: bounds.y - TOOLBAR_HEIGHT,
          } as any);
        }
        return;
      }

      if (
        !this.isMinimized() &&
        this.draggedWindow &&
        !this.windows.find(x => x.id === this.draggedWindow.id)
      ) {
        const winBounds = this.draggedWindow.getBounds();
        const { lastBounds } = this.draggedWindow;
        const contentBounds = this.getContentArea();

        e.y = winBounds.y;

        contentBounds.y -= TOOLBAR_HEIGHT;

        if (this.windows.length > 0) {
          contentBounds.height = 2 * TOOLBAR_HEIGHT;
        }

        if (
          !this.detached &&
          containsPoint(contentBounds, e) &&
          (winBounds.x !== lastBounds.x || winBounds.y !== lastBounds.y)
        ) {
          if (!this.draggedIn) {
            const title = this.draggedWindow.getTitle();
            app.getFileIcon(this.draggedWindow.path, (err, icon) => {
              if (err) console.error(err);

              this.draggedWindow.lastTitle = title;

              this.webContents.send('add-tab', {
                id: this.draggedWindow.id,
                title,
                icon: icon.toPNG(),
              });

              this.draggedIn = true;
              this.willAttachWindow = true;
            });
          }
        } else if (this.draggedIn && !this.detached) {
          this.webContents.send('remove-tab', this.draggedWindow.id);

          this.draggedIn = false;
          this.willAttachWindow = false;
        }
      }
    });

    iohook.on('mouseup', async () => {
      if (this.isUpdatingContentBounds) {
        this.resizeWindow(this.selectedWindow);
      }

      this.isUpdatingContentBounds = false;

      if (this.draggedWindow && this.willAttachWindow) {
        const win = this.draggedWindow;

        if (platform() === 'win32') {
          const handle = this.getNativeWindowHandle().readInt32LE(0);
          win.setOwner(handle);
        }

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
    if (!this.isMinimized()) {
      for (const window of this.windows) {
        const title = window.getTitle();
        if (window.lastTitle !== title) {
          this.webContents.send('update-tab-title', {
            id: window.id,
            title,
          });
          window.lastTitle = title;
        }

        if (!window.isWindow()) {
          this.detachWindow(window);
          this.webContents.send('remove-tab', window.id);
        }
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
      if (window.id === this.selectedWindow.id) {
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
  }

  detachWindow(window: ProcessWindow) {
    if (!window) return;

    if (this.selectedWindow === window) {
      this.selectedWindow = null;
    }

    window.detach();

    this.windows = this.windows.filter(x => x.id !== window.id);
  }
}
