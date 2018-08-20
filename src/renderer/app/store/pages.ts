import { observable } from 'mobx';
import { Page } from '../models/page';
import store from '.';

export class PagesStore {
  @observable
  public pages: Page[] = [];

  public getById(id: number) {
    return this.pages.find(x => x.id === id);
  }

  public getSelected() {
    return this.getById(store.tabsStore.selectedTab);
  }

  public removePage(id: number) {
    (this.pages as any).replace(this.pages.filter(x => x.id !== id));
  }
}
