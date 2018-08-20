import { observable } from 'mobx';

export class Page {
  @observable
  public id: number;

  public webview: Electron.WebviewTag;

  constructor(id: number) {
    this.id = id;
  }
}
