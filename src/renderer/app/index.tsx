import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { injectGlobal } from 'styled-components';

import { Style } from './styles';
import App from './components/app';
import store from '@app/store';

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
  store.tabsStore.addTab();
})();

// react-hot-loader
if ((module as any).hot) {
  (module as any).hot.accept();
}
