import { observer } from 'mobx-react';
import * as React from 'react';
import { createGlobalStyle } from 'styled-components';

import { Toolbar } from '../Toolbar';
import { ipcRenderer } from 'electron';
import { Info, Icon } from './style';
import { Style } from '~/renderer/app/style';

const GlobalStyle = createGlobalStyle`${Style}`;

window.onbeforeunload = () => {
  ipcRenderer.send('browserview-clear');
};

export const App = observer(() => {
  return (
    <React.Fragment>
      <GlobalStyle />
      <Toolbar />
      <Info>
        <Icon /> Drop windows here
      </Info>
    </React.Fragment>
  );
});
