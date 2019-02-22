import { observable } from 'mobx';
import { TabsStore } from './tabs';

import { ipcRenderer } from 'electron';

export class Store {
  public tabsStore = new TabsStore();

  @observable
  public isFullscreen = false;

  @observable
  public updateInfo = {
    available: false,
    version: '',
  };

  public mouse = {
    x: 0,
    y: 0,
  };

  constructor() {
    ipcRenderer.on('fullscreen', (e: any, fullscreen: boolean) => {
      this.isFullscreen = fullscreen;
    });

    ipcRenderer.on(
      'update-available',
      (e: Electron.IpcMessageEvent, version: string) => {
        this.updateInfo.version = version;
        this.updateInfo.available = true;
      },
    );

    ipcRenderer.send('update-check');
  }
}

export default new Store();
