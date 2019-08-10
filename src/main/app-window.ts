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
      } else if (!this.isUpdatingContentBounds && this.selectedContainer) {
        this.selectedContainer.rearrangeWindows();
      }
    };

    this.on('move', updateBounds);
    this.on('resize', updateBounds);

    ipcMain.on('focus', () => {
      if (this.selectedContainer && !this.isMoving) {
        for (const window of this.selectedContainer.windows) {
          window.bringToTop();
        }
      }
    });

    this.on('close', () => {
      clearInterval(this.interval);

      for (const container of this.containers) {
        for (const window of container.windows) {
          window.show();
          container.detachWindow(window);
        }
      }
    });

    this.interval = setInterval(this.intervalCallback, 100);

    ipcMain.on('select-window', (e: any, id: number) => {
      this.selectContainer(this.containers.find(x => x.id === id));
    });

    ipcMain.on('detach-window', (e: any, id: number) => {
      for (const container of this.containers) {
        container.removeWindow(id);
      }
    });

    globalShortcut.register('CmdOrCtrl+Tab', () => {
      if (this.isFocused()) {
        this.webContents.send('next-tab');
      }
    });

    windowManager.on('window-activated', (window: Window) => {
      if (!this._selectedTab) {
        for (const container of this.containers) {
          if (container.windows.find(x => x.id === window.id)) {
            this.webContents.send('select-tab', container.id);
            break;
          }
        }
      }

      this._selectedTab = false;
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

        const id = windowManager.getActiveWindow().id;

        if (this.selectedContainer) {
          const win = this.selectedContainer.windows.find(x => x.id === id);
          this.draggedWindow = win;
        }

        if (!this.draggedWindow) {
          this.draggedWindow = new ProcessWindow(id, this);
        }
      }, 50);
    });

    let draggedContainer: Container;

    iohook.on('mousedrag', async (e: any) => {
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
          if (
            this.selectedContainer.windows.find(
              x => x.id === this.draggedWindow.id,
            ) &&
            (winBounds.width !== lastBounds.width ||
              winBounds.height !== lastBounds.height)
          ) {
            this.selectedContainer.resizeWindow(this.draggedWindow);

            /*this.isUpdatingContentBounds = true;

            const cBounds = this.getContentBounds();

            this.setContentBounds({
              width: cBounds.width + (winBounds.width - lastBounds.width),
              height: cBounds.height + winBounds.height - lastBounds.height,
              x: cBounds.x + winBounds.x - lastBounds.x,
              y: cBounds.y + winBounds.y - lastBounds.y,
            } as any);

            this.draggedWindow.lastBounds = winBounds;*/
          } else if (!this.draggedWindow.resizing) {
            this.selectedContainer.dragWindow(this.draggedWindow, e);
            this.willSplitWindow = true;
          }
        }

        if (
          containsPoint(contentBounds, e) &&
          (winBounds.x !== lastBounds.x || winBounds.y !== lastBounds.y)
        ) {
          if (!this.draggedIn) {
            const win = this.draggedWindow;

            if (this.selectedContainer) {
              this.selectedContainer.removeWindow(win.id);
            }

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
        } else if (this.draggedIn && draggedContainer) {
          this.webContents.send('remove-tab', draggedContainer.id);

          this.draggedIn = false;
          this.willAttachWindow = false;
        }
      }
    });

    iohook.on('mouseup', async () => {
      this.isMoving = false;

      if (this.isUpdatingContentBounds) {
        setTimeout(() => {
          if (this.selectedContainer) {
            this.selectedContainer.rearrangeWindows();
          }
        }, 100);
      }

      this.isUpdatingContentBounds = false;

      if (this.draggedWindow) {
        this.draggedWindow.dragged = false;
        this.draggedWindow.resizing = false;

        if (this.willAttachWindow) {
          const win = this.draggedWindow;
          const container = draggedContainer;

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
        } else if (this.willSplitWindow) {
          this.willSplitWindow = false;

          if (this.selectedContainer) this.selectedContainer.rearrangeWindows();
        }
      }

      draggedContainer = null;
      this.draggedWindow = null;
      this.detached = false;
      this.draggedIn = false;
    });
  }

  intervalCallback = () => {
    if (!this.isMinimized()) {
      for (const container of this.containers) {
        if (container.windows.length === 1) {
          const window = container.windows[0];
          const title = window.getTitle();
          if (window.lastTitle !== title) {
            this.webContents.send('update-tab-title', {
              id: container.id,
              title,
            });
            window.lastTitle = title;
          }
        }

        for (const window of container.windows) {
          if (!window.isWindow()) {
            container.removeWindow(window.id);
          }
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

  removeContainer(container: Container) {
    if (this.selectedContainer === container) {
      this.selectedContainer = null;
    }

    this.webContents.send('remove-tab', container.id);
    this.containers = this.containers.filter(x => x.id !== container.id);
  }
}
