import { observer } from 'mobx-react';
import React from 'react';

import Toolbar from '../Toolbar';
import { StyledApp } from './styles';
import store from '../../store';
import { createGlobalStyle } from 'styled-components';
import { Style } from '@app/styles';

const GlobalStyle = createGlobalStyle`${Style}`;

@observer
class App extends React.Component {
  public async componentDidMount() {
    window.addEventListener('mousemove', this.onWindowMouseMove);
  }

  public onWindowMouseMove = (e: MouseEvent) => {
    store.mouse.x = e.pageX;
    store.mouse.y = e.pageY;
  };

  public componentWillUnmount() {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
  }

  public render() {
    return (
      <StyledApp>
        <GlobalStyle />
        <Toolbar />
      </StyledApp>
    );
  }
}

export default App;
