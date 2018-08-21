import { BrowserWindow } from 'electron';
import { join } from 'path';

export const createWindow = () => {
  const windowData: Electron.BrowserWindowConstructorOptions = {
    frame: process.env.ENV !== 'dev',
    minWidth: 400,
    minHeight: 450,
    width: 900,
    height: 700,
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      plugins: true,
    },
  };

  const window = new BrowserWindow(windowData);

  window.webContents.openDevTools({ mode: 'detach' });

  if (process.env.ENV === 'dev') {
    window.loadURL('http://localhost:8080/app.html');
  } else {
    window.loadURL(join('file://', __dirname, 'static/pages/app.html'));
  }

  window.once('ready-to-show', () => {
    window.show();
  });

  return window;
};
