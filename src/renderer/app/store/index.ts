import { observable, computed } from 'mobx';
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

  @observable
  public isDark = false;

  @computed
  public get background() {
    return this.isDark ? '#000' : '#fff';
  }

  @computed
  public get foreground() {
    return this.isDark ? '#fff' : '#000';
  }

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
