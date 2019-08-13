import { observer } from 'mobx-react-lite';
import * as React from 'react';

import HorizontalScrollbar from '../HorizontalScrollbar';
import store from '~/renderer/views/app/store';
import { StyledTabbar, TabsContainer } from './style';
import { Tabs } from '../Tabs';

const getContainer = () => store.tabsStore.containerRef.current;

const onMouseEnter = () => (store.tabsStore.scrollbarVisible = true);

const onMouseLeave = () => (store.tabsStore.scrollbarVisible = false);

export const Tabbar = observer(() => {
  return (
    <StyledTabbar>
      <TabsContainer
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={store.tabsStore.containerRef}
      >
        <Tabs />
      </TabsContainer>
      <HorizontalScrollbar
        ref={store.tabsStore.scrollbarRef}
        enabled={store.tabsStore.scrollable}
        visible={store.tabsStore.scrollbarVisible}
        getContainer={getContainer}
      />
    </StyledTabbar>
  );
});
