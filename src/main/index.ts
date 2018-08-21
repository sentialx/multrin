import { app, ipcMain } from 'electron';
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

interface Tab {
  id: number;
  window: any;
}

const tabs: Tab[] = [];

const containsWindow = (window: any) => {
  for (const tab of tabs) {
    if (tab.window.handle === window.handle) return true;
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
  const windowExternalHeight = -2;
  const windowExternalWidth = -4;

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
    for (const tab of tabs) {
      const { x, y, width, height } = mainWindow.getContentBounds();
      moveWindow(tab.window, x, y, width, height);
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
          mainWindow.webContents.send('add-tab');

          ipcMain.once('add-tab', (e: Electron.IpcMessageEvent, id: number) => {
            moveWindow(window, x, y, width, height);
            window.setTopMost(true);
            window.setStyle(
              window.getStyle() &
                ~(
                  WindowStyles.THICKFRAME |
                  WindowStyles.SIZEBOX |
                  WindowStyles.CAPTION
                ),
            );

            tabs.push({
              window,
              id,
            });

            console.log(tabs);
          });
        } else {
          window.setTopMost(false);
          // window.setFrameless(false);
        }
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (platform() !== 'darwin') {
    app.quit();
  }
});
