import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { injectGlobal } from 'styled-components';

import { Style } from './styles';
import App from './components/app';
import store from '@app/store';
import { ipcMain, ipcRenderer } from 'electron';

injectGlobal`${Style}`;

const render = (AppComponent: any) => {
  ReactDOM.render(
    <AppContainer>
      <AppComponent />
    </AppContainer>,
    document.getElementById('app'),
  );
};
(async function setup() {
  render(App);

  ipcRenderer.on('add-tab', () => {
    const tab = store.tabsStore.addTab();
    ipcRenderer.send('add-tab', tab.id);
  });
})();

// react-hot-loader
if ((module as any).hot) {
  (module as any).hot.accept();
}
