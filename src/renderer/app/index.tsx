import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import { Style } from './styles';
import App from './components/app';
import store from '@app/store';
import { ipcMain, ipcRenderer } from 'electron';
import { fonts } from '~/defaults';

const styleElement = document.createElement('style');

styleElement.textContent = `
@font-face {
  font-family: "Roboto";
  font-style: normal;
  font-weight: 400;
  src: url(${fonts.robotoRegular}) format("truetype");
}

@font-face {
  font-family: "Roboto";
  font-style: normal;
  font-weight: 500;
  src: url(${fonts.robotoMedium}) format("truetype");
}

@font-face {
  font-family: "Roboto";
  font-style: normal;
  font-weight: 300;
  src: url(${fonts.robotoLight}) format("truetype");
}
`;

document.head.appendChild(styleElement);

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
    const tab = store.tabsStore.addTab({ active: false });
    ipcRenderer.send('add-tab', tab.id);
    tab.select();
  });
})();

// react-hot-loader
if ((module as any).hot) {
  (module as any).hot.accept();
}
