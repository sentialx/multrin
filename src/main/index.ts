import { ipcMain, app, Menu, session } from 'electron';
import { resolve } from 'path';
import { platform, homedir } from 'os';
import { AppWindow } from './app-window';
import { autoUpdater } from 'electron-updater';

ipcMain.setMaxListeners(0);

app.setPath('userData', resolve(homedir(), '.multrin'));

export let appWindows: AppWindow[] = [];

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

app.on('ready', () => {
  // Create our menu entries so that we can use macOS shortcuts
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' },
          { role: 'quit' },
          { role: 'reload' },
          {
            type: 'normal',
            accelerator: 'CmdOrCtrl+Shift+R',
            label: 'Reload main process',
            click() {
              app.relaunch();
              app.exit();
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
