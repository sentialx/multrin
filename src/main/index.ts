import { app } from 'electron';
import { resolve } from 'path';
import { platform, homedir } from 'os';

import { createWindow } from './utils';

app.setPath('userData', resolve(homedir(), '.multrin'));

let mainWindow: Electron.BrowserWindow;

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    mainWindow = createWindow();
  }
});

app.on('ready', () => {
  mainWindow = createWindow();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (platform() !== 'darwin') {
    app.quit();
  }
});
