import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { createGlobalStyle, ThemeProvider } from 'styled-components';

import { Style } from '../../style';
import { StyledApp } from './style';
import { Textfield } from '~/renderer/components/Textfield';
import { ipcRenderer } from 'electron';
import store from '../../store';
import { QuickMenu } from '../QuickMenu';

const GlobalStyle = createGlobalStyle`${Style}`;

const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  ipcRenderer.send(`set-title-${store.id}`, e.currentTarget.value);
};

export const App = observer(() => {
  return (
    <ThemeProvider theme={{}}>
      <StyledApp>
        <GlobalStyle />
        <Textfield
          ref={store.inputRef}
          value={ipcRenderer.sendSync(`get-title-${store.id}`)}
          style={{ width: '100%' }}
          onInput={onInput}
          label="Window title"
        />
        <QuickMenu />
      </StyledApp>
    </ThemeProvider>
  );
});
