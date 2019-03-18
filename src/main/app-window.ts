import { BrowserWindow, app, ipcMain, screen } from 'electron';
import { resolve, join } from 'path';
import { platform } from 'os';
import mouseEvents from 'mouse-hooks';
import { windowManager, Window } from 'node-window-manager';
import { getFileIcon } from 'extract-file-icon';
import console = require('console');
import { appWindow } from '.';
import { TOOLBAR_HEIGHT } from '~/renderer/app/constants';

export class ProcessWindow extends Window {
  public resizable = false;
  public maximizable = false;
  public minimizable = false;

  public lastTitle: string;

  public opacity: number;

  public lastBounds: any;
  public initialBounds: any;

  constructor(handle: number) {
    super(handle);

    this.opacity = this.getOpacity();
    this.opacity = this.opacity === 0 ? 1 : this.opacity;
    this.lastBounds = this.getBounds();
    this.initialBounds = this.getBounds();
  }

  public detach() {
    this.setParent(null);

    setTimeout(() => {
      this.hide();
      this.show();
    }, 10);

    mouseEvents.once('mouse-up', () => {
      setTimeout(() => {
        this.setBounds({
          width: this.initialBounds.width,
          height: this.initialBounds.height,
        });
      }, 50);
    });
  }
}

export class AppWindow extends BrowserWindow {
  public windows: ProcessWindow[] = [];
  public selectedWindow: ProcessWindow;

  public window: Window;
  public draggedWindow: ProcessWindow;

  public draggedIn = false;

  public lastBounds: any;

  public detached = false;

  public isMoving = false;

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

    const { x, y } = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint({ x, y });
    this.setPosition(currentDisplay.workArea.x, currentDisplay.workArea.y);
    this.center();

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
      this.isMoving = true;
      this.resizeWindow(this.selectedWindow);
    };

    this.on('move', updateBounds);
    this.on('resize', updateBounds);

    this.on('close', () => {
      for (const window of this.windows) {
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
    });

    mouseEvents.on('mouse-down', () => {
      if (this.isMinimized()) return;

      setTimeout(() => {
        this.draggedWindow = new ProcessWindow(
          windowManager.getActiveWindow().handle,
        );

        if (this.draggedWindow.handle === handle) {
          this.draggedWindow = null;
          return;
        }

        this.lastBounds = this.draggedWindow.getBounds();
      }, 50);
    });

    mouseEvents.on('mouse-up', async data => {
      if (this.selectedWindow && !this.isMoving) {
        const bounds = this.selectedWindow.getBounds();
        const { lastBounds } = this.selectedWindow;

        if (
          !this.isMaximized() &&
          (bounds.width !== lastBounds.width ||
            bounds.height !== lastBounds.height)
        ) {
          clearInterval(this.interval);

          const sf = windowManager.getScaleFactor(
            windowManager.getMonitorFromWindow(this.window),
          );

          this.selectedWindow.lastBounds = bounds;

          bounds.width /= sf;
          bounds.height /= sf;
          bounds.x /= sf;
          bounds.y /= sf;

          bounds.width = Math.round(bounds.width);
          bounds.height = Math.round(bounds.height);
          bounds.x = Math.round(bounds.x);
          bounds.y = Math.round(bounds.y);

          this.setContentBounds({
            width: bounds.width,
            height: bounds.height + TOOLBAR_HEIGHT,
            x: bounds.x,
            y: bounds.y - TOOLBAR_HEIGHT,
          });

          setTimeout(() => {
            this.resizeWindow(this.selectedWindow);

            this.interval = setInterval(this.intervalCallback, 100);
          }, 50);
        } else {
          setTimeout(() => {
            this.resizeWindow(this.selectedWindow);
          }, 50);
        }
      }

      this.isMoving = false;

      if (this.draggedWindow && !this.isMinimized()) {
        const contentArea = this.getContentArea();
        const bounds = this.draggedWindow.getBounds();

        if (
          this.draggedWindow &&
          !this.detached &&
          !this.windows.find(x => x.handle === this.draggedWindow.handle) &&
          data.x >= contentArea.x &&
          data.x <= contentArea.x + contentArea.width &&
          data.y >= contentArea.y - TOOLBAR_HEIGHT &&
          data.y <=
            contentArea.y +
              (this.windows.length > 0 ? 0 : contentArea.height) &&
          this.lastBounds &&
          (bounds.x !== this.lastBounds.x || bounds.y !== this.lastBounds.y)
        ) {
          const win = this.draggedWindow;

          win.setParent(this.window);
          win.setOpacity(win.opacity);

          this.windows.push(win);

          setTimeout(() => {
            this.selectWindow(win);
          }, 50);
        }
      }

      this.draggedWindow = null;
      this.lastBounds = null;
      this.detached = false;
    });
  }

  intervalCallback = () => {
    if (this.isMoving) return;

    const contentBounds = this.getContentArea();
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

        if (
          contentBounds.x !== newBounds.x ||
          (contentBounds.y !== newBounds.y &&
            (newBounds.width === this.lastBounds.width &&
              newBounds.height === this.lastBounds.height))
        ) {
          const window = this.selectedWindow;
          this.detachWindow(window);
          this.detached = true;

          this.webContents.send('remove-tab', window.handle);
        }
      }
    }

    if (
      this.draggedWindow &&
      !this.windows.find(x => x.handle === this.draggedWindow.handle)
    ) {
      const winBounds = this.draggedWindow.getBounds();
      if (
        !this.detached &&
        cursor.x >= contentBounds.x &&
        cursor.x <= contentBounds.x + contentBounds.width &&
        cursor.y >= contentBounds.y - TOOLBAR_HEIGHT &&
        cursor.y <=
          contentBounds.y +
            (this.windows.length > 0 ? 0 : contentBounds.height) &&
        this.lastBounds &&
        (winBounds.x !== this.lastBounds.x || winBounds.y !== this.lastBounds.y)
      ) {
        if (!this.draggedIn) {
          this.draggedWindow.setOpacity(this.draggedWindow.opacity / 1.5);

          const title = this.draggedWindow.getTitle();
          const icon = getFileIcon(this.draggedWindow.process.path);

          this.draggedWindow.lastTitle = title;

          this.webContents.send('add-tab', {
            id: this.draggedWindow.handle,
            title,
            icon,
          });

          this.draggedIn = true;
        }
      } else if (this.draggedIn) {
        this.draggedWindow.setOpacity(this.draggedWindow.opacity);

        this.webContents.send('remove-tab', this.draggedWindow.handle);

        this.draggedIn = false;
      }
    }
  };

  getContentArea() {
    const bounds = this.getContentBounds();

    bounds.y += TOOLBAR_HEIGHT;
    bounds.height -= TOOLBAR_HEIGHT;

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
