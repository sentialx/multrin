import { observable } from 'mobx';
import os from 'os';

import { TabsStore } from './tabs';
import { AddTabStore } from './add-tab';
import { Platforms } from '~/enums';

export class Store {
  public tabsStore = new TabsStore();
  public addTabStore = new AddTabStore();

  @observable
  public isFullscreen = false;

  @observable
  public isHTMLFullscreen = false;

  @observable
  public updateInfo = {
    available: false,
    version: '',
  };

  public platform = os.platform() as Platforms;
  public mouse = {
    x: 0,
    y: 0,
  };
}

export default new Store();
