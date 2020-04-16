import { observer } from 'mobx-react-lite';
import * as React from 'react';

import HorizontalScrollbar from '../HorizontalScrollbar';
import store from '~/renderer/views/app/store';
import { StyledTabbar, TabsContainer, AddTab } from './style';
import { Tabs } from '../Tabs';
import { icons } from '../../constants';

const getContainer = () => store.tabsStore.containerRef.current;

const onMouseEnter = () => (store.tabsStore.scrollbarVisible = true);

const onMouseLeave = () => (store.tabsStore.scrollbarVisible = false);

const onAddTabClick = () => {
  store.tabsStore.newTab();
};

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
      <AddTab
        icon={icons.add}
        onClick={onAddTabClick}
        divRef={(r: any) => (store.addTab.ref = r)}
      />
      <HorizontalScrollbar
        ref={store.tabsStore.scrollbarRef}
        enabled={store.tabsStore.scrollable}
        visible={store.tabsStore.scrollbarVisible}
        getContainer={getContainer}
      />
    </StyledTabbar>
  );
});
