import { BrowserWindow, app } from 'electron';
import { resolve, join } from 'path';
import { platform } from 'os';
import mouseEvents from 'mouse-hooks';
import { windowManager, Window } from 'node-window-manager';
import console = require('console');

export class AppWindow extends BrowserWindow {
  public windows: Window[] = [];
  public selectedWindow: Window;
  public isMoving = false;

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

    this.on('move', () => {
      if (this.selectedWindow) {
        this.selectedWindow.setBounds(this.getContentArea());
      }
    });

    const handle = this.getNativeWindowHandle().readInt32LE(0);
    const currentWindow = new Window(handle);

    mouseEvents.on('mouse-up', () => {
      const window = windowManager.getActiveWindow();
      const contentArea = this.getContentArea();
      const bounds = window.getBounds();

      if (
        !this.windows.find(x => x.handle === window.handle) &&
        window.handle !== handle &&
        bounds.x >= contentArea.x &&
        bounds.x <= contentArea.x + contentArea.width &&
        bounds.y >= contentArea.y - 42 &&
        bounds.y <= contentArea.y
      ) {
        window.setParent(currentWindow);

        this.selectedWindow = window;
        this.windows.push(window);

        setTimeout(() => {
          window.setBounds(contentArea);
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
}
