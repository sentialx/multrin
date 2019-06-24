import { BrowserWindow, app, screen, globalShortcut, ipcMain } from 'electron';
import { resolve, join } from 'path';
import { platform } from 'os';
import { windowManager, Window } from 'node-window-manager';
import console = require('console');
import { TOOLBAR_HEIGHT } from '~/renderer/app/constants/design';
import { ProcessWindow } from './process-window';
import { Container } from './container';

const fileIcon = require('extract-file-icon');
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
  public containers: Container[] = [];
  public selectedContainer: Container;

  public draggedWindow: ProcessWindow;

  public draggedIn = false;
  public detached = false;
  public willAttachWindow = false;
  public willSplitWindow = false;
  public isMoving = false;
  public isUpdatingContentBounds = false;

  public interval: any;

  private _selectedTab = false;

  constructor() {
    super({
      frame: false,
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
        for (const c of this.containers) {
          if (
            c &&
            ((this.selectedContainer !== c && this.isUpdatingContentBounds) ||
              !this.isUpdatingContentBounds)
          ) {
            c.rearrangeWindows();
          }
        }
      } else if (!this.isUpdatingContentBounds) {
        this.selectedContainer.rearrangeWindows();
      }
    };

    this.on('move', updateBounds);
    this.on('resize', updateBounds);

    /*ipcMain.on('focus', () => {
      if (this.selectedWindow && !this.isMoving) {
        this.selectedWindow.bringToTop();
      }
    });*/

    this.on('close', () => {
      clearInterval(this.interval);

      /*for (const window of this.windows) {
        window.show();
        this.detachWindow(window);
      }*/
    });

    this.interval = setInterval(this.intervalCallback, 100);

    ipcMain.on('select-window', (e: any, id: number) => {
      this.selectContainer(this.containers.find(x => x.id === id));
    });

    /*ipcMain.on('detach-window', (e: any, id: number) => {
      this.detachWindow(this.windows.find(x => x.id === id));
    });*/

    windowManager.on('window-activated', (window: Window) => {
      if (!this._selectedTab) {
        this.webContents.send('select-tab', window.id);
      }

      this._selectedTab = false;

      /*if (
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
      }*/
    });

    iohook.on('mousedown', () => {
      if (this.isMinimized()) return;

      if (this.isFocused()) {
        this._selectedTab = true;
      }

      setTimeout(() => {
        if (this.isFocused()) {
          this.draggedWindow = null;
          return;
        }
        this.draggedWindow = new ProcessWindow(
          windowManager.getActiveWindow().id,
          this,
        );
        this.draggedWindow.dragged = true;
      }, 50);
    });

    let draggedContainer: Container;

    iohook.on('mousedrag', async (e: any) => {
      /*if (
        this.draggedWindow &&
        this.selectedWindow &&
        this.draggedWindow.id === this.selectedWindow.id &&
        !this.isFocused()
      ) {
        const bounds = this.selectedWindow.getBounds();
        const { lastBounds } = this.selectedWindow;

        if (
          (bounds.x !== lastBounds.x || bounds.y !== lastBounds.y) &&
          bounds.width === lastBounds.width &&
          bounds.height === lastBounds.height
        ) {
          const win = this.selectedWindow;
          this.detachWindow(this.selectedWindow);
          this.detached = true;

          iohook.once('mouseup', () => {
            setTimeout(() => {
              win.setBounds({
                width: win.initialBounds.width,
                height: win.initialBounds.height,
              });
            }, 50);
          });
        } else if (!this.isMoving) {
          this.isUpdatingContentBounds = true;

          this.selectedWindow.lastBounds = bounds;

          this.setContentBounds({
            width: bounds.width,
            height: bounds.height + TOOLBAR_HEIGHT,
            x: bounds.x,
            y: bounds.y - TOOLBAR_HEIGHT,
          } as any);

          this.isMoving = false;
        }
        return;
      }*/

      if (!this.isMinimized() && this.draggedWindow) {
        const winBounds = this.draggedWindow.getBounds();
        const { lastBounds } = this.draggedWindow;
        const contentBounds = this.getContentArea();

        e.y = winBounds.y;

        contentBounds.y -= TOOLBAR_HEIGHT;

        if (this.containers.length > 0) {
          contentBounds.height = TOOLBAR_HEIGHT;
        }

        if (this.selectedContainer) {
          this.selectedContainer.addWindow(this.draggedWindow, e);
          this.willSplitWindow = true;
        }

        if (
          !this.detached &&
          containsPoint(contentBounds, e) &&
          (winBounds.x !== lastBounds.x || winBounds.y !== lastBounds.y)
        ) {
          if (!this.draggedIn) {
            const win = this.draggedWindow;
            const container = new Container(this, win);

            const title = this.draggedWindow.getTitle();

            draggedContainer = container;
            win.lastTitle = title;

            this.webContents.send('add-tab', {
              id: container.id,
              title,
              icon: fileIcon(win.path, 16),
            });

            this.draggedIn = true;
            this.willAttachWindow = true;
          }
        } else if (this.draggedIn && !this.detached && draggedContainer) {
          this.webContents.send('remove-tab', draggedContainer.id);

          this.draggedIn = false;
          this.willAttachWindow = false;
        }
      }
    });

    iohook.on('mouseup', async () => {
      this.isMoving = false;

      if (this.isUpdatingContentBounds) {
        // this.resizeWindow(this.selectedWindow);
      }

      this.isUpdatingContentBounds = false;

      if (this.draggedWindow) {
        if (this.willAttachWindow) {
          const win = this.draggedWindow;
          const container = draggedContainer;

          win.dragged = false;

          if (platform() === 'win32') {
            const handle = this.getNativeWindowHandle().readInt32LE(0);
            win.setOwner(handle);
          }

          this.containers.push(draggedContainer);
          this.willAttachWindow = false;

          draggedContainer.rearrangeWindows();

          setTimeout(() => {
            this.selectContainer(container);
          }, 50);
        } else {
          this.willSplitWindow = false;
          this.draggedWindow.dragged = false;
          this.selectedContainer.rearrangeWindows();
        }
      }

      draggedContainer = null;
      this.draggedWindow = null;
      this.detached = false;
    });
  }

  intervalCallback = () => {
    /*if (!this.isMinimized()) {
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
    }*/
  };

  getContentArea() {
    const bounds = this.getContentBounds();

    bounds.y += TOOLBAR_HEIGHT;
    bounds.height -= TOOLBAR_HEIGHT;

    return bounds;
  }

  selectContainer(container: Container) {
    if (!container) return;

    if (this.selectedContainer) {
      if (container.id === this.selectedContainer.id) {
        return;
      }

      this.selectedContainer.hideWindows();
    }

    container.showWindows();
    this.selectedContainer = container;
  }

  detachWindow(window: ProcessWindow) {
    /*if (!window) return;

    if (this.selectedWindow === window) {
      this.selectedWindow = null;
    }

    window.detach();

    this.windows = this.windows.filter(x => x.id !== window.id);*/
  }
}
