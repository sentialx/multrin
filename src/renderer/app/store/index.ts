import { observable } from 'mobx';
import os from 'os';

import { TabsStore } from './tabs';
import { AddTabStore } from './add-tab';
import { Platforms } from '~/enums';
import { PagesStore } from './pages';

export class Store {
  public tabsStore = new TabsStore();
  public pagesStore = new PagesStore();
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
