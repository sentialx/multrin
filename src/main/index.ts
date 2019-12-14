import { ipcMain, app, Menu, webContents } from 'electron';
import { resolve } from 'path';
import { platform, homedir } from 'os';
import { AppWindow } from './windows/app';
import { autoUpdater } from 'electron-updater';
import { Settings } from './settings';

ipcMain.setMaxListeners(0);

app.setPath('userData', resolve(homedir(), '.multrin'));

export const appWindows: AppWindow[] = [];

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (e, argv) => {
    if (appWindows.length > 0) {
      appWindows.push(new AppWindow());
    }
  });
}

export const settings = new Settings();

export const iohook = require('iohook');

app.on('ready', () => {
  iohook.start();

  // Create our menu entries so that we can use macOS shortcuts
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        role: 'editMenu',
        label: 'Edit',
      },
      {
        label: 'Other',
        submenu: [
          {
            accelerator: 'CmdOrCtrl+Shift+F12',
            label: 'Toggle developer tools (window)',
            visible: false,
            click() {
              webContents.getFocusedWebContents().openDevTools();
            },
          },
        ],
      },
    ]),
  );

  app.on('activate', () => {
    if (appWindows.length === 0) {
      appWindows.push(new AppWindow());
    }
  });

  appWindows.push(new AppWindow());

  autoUpdater.on('update-downloaded', ({ version }) => {
    for (const w of appWindows) {
      w.webContents.send('update-available', version);
    }
  });

  ipcMain.on('update-install', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('update-check', () => {
    if (process.env.ENV !== 'dev') {
      autoUpdater.checkForUpdates();
    }
  });
});

app.on('window-all-closed', () => {
  if (platform() !== 'darwin') {
    app.quit();
  }
});
