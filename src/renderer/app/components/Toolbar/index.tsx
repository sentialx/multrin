import { observer } from 'mobx-react';
import React from 'react';

import TabBar from '../TabBar';
import { StyledToolbar } from './styles';
import store from '@app/store';

@observer
export default class Toolbar extends React.Component {
  public render() {
    return (
      <StyledToolbar isHTMLFullscreen={store.isHTMLFullscreen}>
        <TabBar />
      </StyledToolbar>
    );
  }
}
