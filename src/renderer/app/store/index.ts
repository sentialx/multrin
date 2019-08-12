import { observable, computed } from 'mobx';
import { TabsStore } from './tabs';

import { ipcRenderer } from 'electron';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { getPath } from '~/shared/utils/paths';

const settingsPath = getPath('settings.json');

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
    return this.isDark ? '#212121' : '#fff';
  }

  @computed
  public get foreground() {
    return this.isDark ? '#fff' : '#000';
  }

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

    if (!existsSync(settingsPath)) {
      this.saveSettings();
    } else {
      this.settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
      this.isDark = this.settings.dark;
    }
  }

  public saveSettings() {
    writeFileSync(settingsPath, JSON.stringify(this.settings), 'utf8');
  }
}

export default new Store();
