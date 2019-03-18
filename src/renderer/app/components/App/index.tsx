import { observer } from 'mobx-react';
import * as React from 'react';
import { createGlobalStyle } from 'styled-components';

import { Toolbar } from '../Toolbar';
import { ipcRenderer } from 'electron';
import { Info, Icon, Handle } from './style';
import { Style } from '~/renderer/app/style';
import store from '../../store';

const GlobalStyle = createGlobalStyle`${Style}`;

window.onbeforeunload = () => {
  ipcRenderer.send('browserview-clear');
};

export const App = observer(() => {
  return (
    <React.Fragment>
      <GlobalStyle />
      <Handle />
      <Toolbar />
      <Info visible={store.tabsStore.tabs.length === 0}>
        <Icon /> Drop windows here
      </Info>
    </React.Fragment>
  );
});
