import { observable, computed } from 'mobx';
import { TabsStore } from './tabs';

import { ipcRenderer, remote } from 'electron';
import { getPath } from '~/shared/utils/paths';
import { AddTabStore } from './add-tab';

export class Store {
  public addTab = new AddTabStore();
  public tabsStore = new TabsStore();

  @observable
  public isFullscreen = false;

  @observable
  public updateInfo = {
    available: false,
    version: '',
  };

  @computed
  public get background() {
    return this.settings.dark ? '#212121' : '#fff';
  }

  @computed
  public get foreground() {
    return this.settings.dark ? '#fff' : '#000';
  }

  public windowId = remote.getCurrentWindow().id;

  @observable
  public settings: any = {};

  public mouse = {
    x: 0,
    y: 0,
  };

  public constructor() {
    ipcRenderer.on('fullscreen', (e: any, fullscreen: boolean) => {
      this.isFullscreen = fullscreen;
    });

    ipcRenderer.on('update-available', (e, version: string) => {
      this.updateInfo.version = version;
      this.updateInfo.available = true;
    });

    ipcRenderer.send('update-check');

    this.settings = ipcRenderer.sendSync('get-settings');

    ipcRenderer.on('update-settings', (e, s) => {
      this.settings = { ...this.settings, ...s };
    });
  }
}

export default new Store();
