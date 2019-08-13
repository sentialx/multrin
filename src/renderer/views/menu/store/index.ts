import { ipcRenderer, remote } from 'electron';
import { observable } from 'mobx';

export class Store {
  @observable
  public visible = true;

  public id = remote.getCurrentWindow().id;

  public constructor() {
    window.addEventListener('blur', () => {
      setTimeout(() => {
        ipcRenderer.send(`hide-${this.id}`);
      });
    });
  }
}

export default new Store();
