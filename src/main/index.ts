import { app, ipcMain } from 'electron';
import { resolve } from 'path';
import { platform, homedir } from 'os';
import { WindowStyles, windowsManager, Window, SWP } from 'window-manager';
import { fork } from 'child_process';

import { createWindow } from './utils';
import { TOOLBAR_HEIGHT } from '~/constants';

app.setPath('userData', resolve(homedir(), '.multrin'));

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
  window: Window;
}

let selectedTab: number;
const tabs: Tab[] = [];

const containsWindow = (window: Window) => {
  for (const tab of tabs) {
    if (tab.window.handle === window.handle) return true;
  }
  return false;
};

const moveWindow = (
  window: Window,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const windowExternalHeight = 6;
  const windowExternalWidth = 14;

  window.move(
    x - windowExternalWidth / 2,
    y + TOOLBAR_HEIGHT - 1,
    width + windowExternalWidth,
    height - TOOLBAR_HEIGHT + windowExternalHeight,
  );
};

const adaptWindow = (window: Window) => {
  const { x, y, width, height } = mainWindow.getContentBounds();
  moveWindow(window, x, y, width, height);
};

const getTabById = (id: number) => {
  return tabs.find(x => x.id === id);
};

const getSelectedTab = () => {
  return getTabById(selectedTab);
};

const bringSelectedWindowToTop = () => {
  const tab = getSelectedTab();

  if (tab) {
    tab.window.setTopMost(true, SWP.NOACTIVATE);
    tab.window.setTopMost(false, SWP.NOACTIVATE);
  }
};

const getHandleBuffer = (handle: number) => {
  const buf = new Buffer(8);
  buf.fill(0);
  buf.writeInt32LE(handle, 0);
  return buf;
};

app.on('ready', () => {
  mainWindow = createWindow();

  const handle = mainWindow.getNativeWindowHandle();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const moveAndResize = () => {
    bringSelectedWindowToTop();
    adaptWindow(getSelectedTab().window);
  };

  ipcMain.on('select-tab', (e: Electron.IpcMessageEvent, id: number) => {
    if (selectedTab === id) return;

    let tab = getSelectedTab();

    if (tab) {
      tab.window.hide();
    }

    selectedTab = id;
    tab = getSelectedTab();

    if (tab) {
      const { window } = tab;
      adaptWindow(window);

      window.show();
      window.setTopMost(true, SWP.NOACTIVATE);
      window.setTopMost(false, SWP.NOACTIVATE);
    }
  });

  mainWindow.on('move', moveAndResize);
  mainWindow.on('resize', moveAndResize);

  mainWindow.on('focus', () => {
    bringSelectedWindowToTop();
  });

  mainWindow.on('maximize', () => {
    bringSelectedWindowToTop();
  });

  const hook = fork('./src/main/mouseup-hook.js');

  hook.on('message', message => {
    if (message === 'mouseup') {
      const window = windowsManager.getActive();

      if (
        !containsWindow(window) &&
        !getHandleBuffer(window.handle).equals(handle)
      ) {
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
            adaptWindow(window);
            tabs.push({
              window,
              id,
            });
          });
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
