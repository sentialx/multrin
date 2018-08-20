import React from 'react';
import { observer } from 'mobx-react';

import store from '@app/store';
import Tab from '../Tab';

@observer
export default class extends React.Component {
  public render() {
    return (
      <React.Fragment>
        {store.tabsStore.tabs.map(tab => (
          <Tab key={tab.id} tab={tab} />
        ))}
      </React.Fragment>
    );
  }
}
