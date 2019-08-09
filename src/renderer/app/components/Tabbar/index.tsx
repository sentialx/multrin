import { observer } from 'mobx-react';
import * as React from 'react';

import HorizontalScrollbar from '../HorizontalScrollbar';
import store from '~/renderer/app/store';
import { Tabs } from '../Tabs';

import * as styles from './style.css';

const getContainer = () => store.tabsStore.containerRef.current;

const onMouseEnter = () => (store.tabsStore.scrollbarVisible = true);

const onMouseLeave = () => (store.tabsStore.scrollbarVisible = false);

export const Tabbar = observer(() => {
  return (
    <div className={styles.tabbar}>
      <div
        className={styles.tabsContainer}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={store.tabsStore.containerRef}
      >
        <Tabs />
      </div>
      <HorizontalScrollbar
        ref={store.tabsStore.scrollbarRef}
        enabled={store.tabsStore.scrollable}
        visible={store.tabsStore.scrollbarVisible}
        getContainer={getContainer}
      />
    </div>
  );
});
