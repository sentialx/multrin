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
}

export default new Store();
