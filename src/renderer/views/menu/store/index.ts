import { remote, ipcRenderer } from 'electron';
import { observable } from 'mobx';
import * as React from 'react';
import { Textfield } from '~/renderer/components/Textfield';

export class Store {
  @observable
  public visible = true;

  public inputRef = React.createRef<Textfield>();

  public id = ipcRenderer.sendSync(
    `get-window-id-${remote.getCurrentWindow().id}`,
  );

  @observable
  public settings: any;

  public constructor() {
    this.settings = ipcRenderer.sendSync('get-settings');

    ipcRenderer.on('update-settings', (e, s) => {
      this.settings = s;
    });
  }

  public saveSettings() {
    ipcRenderer.send('save-settings', {
      settings: JSON.stringify(this.settings),
    });
  }
}

export default new Store();
