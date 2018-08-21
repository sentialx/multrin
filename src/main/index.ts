import { app } from 'electron';
import { resolve } from 'path';
import { platform, homedir } from 'os';
import { WindowStyles, windowsManager } from 'window-manager';
import { fork } from 'child_process';

import { createWindow } from './utils';
import { TOOLBAR_HEIGHT } from '~/constants';

app.setPath('userData', resolve(homedir(), '.multrin'));

console.log(windowsManager);

let mainWindow: Electron.BrowserWindow;

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    mainWindow = createWindow();
  }
});

const getNumber = (str: string) => {
  let newStr = '';

  for (let i = 0; i < str.length; i++) {
    newStr += str[i].charCodeAt(0);
  }

  return parseInt(newStr, 10);
};

const windows: any = [];

const containsWindow = (window: any) => {
  for (const win of windows) {
    if (win.handle === window.handle) return true;
  }
  return false;
};

const moveWindow = (
  window: any,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const windowExternalHeight = 8;
  const windowExternalWidth = 14;

  window.move(
    x - windowExternalWidth / 2,
    y + TOOLBAR_HEIGHT,
    width + windowExternalWidth,
    height - TOOLBAR_HEIGHT + windowExternalHeight,
  );
};

app.on('ready', () => {
  mainWindow = createWindow();

  const handle = mainWindow.getNativeWindowHandle();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const moveAndResize = () => {
    for (const win of windows) {
      const { x, y, width, height } = mainWindow.getContentBounds();
      moveWindow(win, x, y, width, height);
    }
  };

  mainWindow.on('move', moveAndResize);
  mainWindow.on('resize', moveAndResize);

  const hook = fork('./src/main/mouseup-hook.js');

  hook.on('message', message => {
    if (message === 'mouseup') {
      const window = windowsManager.getActive();

      const buf = new Buffer(8);
      buf.fill(0);

      buf.writeInt32LE(window.handle, 0);

      if (!containsWindow(window) && buf.compare(handle)) {
        const { left, top } = window.getBounds();
        const { x, y, width, height } = mainWindow.getContentBounds();

        if (
          left >= x &&
          left <= x + width &&
          top >= y &&
          top <= y + TOOLBAR_HEIGHT
        ) {
          setTimeout(() => {
            console.log('attached');
            moveWindow(window, x, y, width, height);
            window.setTopMost(true);
          }, 20);
        } else {
          window.setTopMost(false);
          // window.setFrameless(false);
        }

        windows.push(window);
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (platform() !== 'darwin') {
    app.quit();
  }
});
