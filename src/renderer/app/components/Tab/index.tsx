import { observer } from 'mobx-react';
import React from 'react';

import { Circle, StyledTab, Content, Icon, Title, Close } from './styles';
import { Tab } from '../../models';
import store from '@app/store';
import { closeWindow } from '~/utils/window';
import { TAB_ANIMATION_DURATION } from '~/constants';

@observer
export default class extends React.Component<{ tab: Tab }, {}> {
  public componentDidMount() {
    const { tab } = this.props;

    tab.setLeft(tab.getLeft(), false);
    store.tabsStore.updateTabsBounds(true);
  }

  public onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const { pageX } = e;
    const { tab } = this.props;

    tab.select();

    store.tabsStore.lastMouseX = 0;
    store.tabsStore.isDragging = true;
    store.tabsStore.mouseStartX = pageX;
    store.tabsStore.tabStartX = tab.left;

    store.tabsStore.lastScrollLeft = store.tabsStore.containerRef.scrollLeft;
  };

  public onCloseMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  public onCloseClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { tab } = this.props;
    const { tabs, selectedTab } = store.tabsStore;
    const selected = selectedTab === tab.id;

    e.stopPropagation();

    store.tabsStore.resetRearrangeTabsTimer();

    const notClosingTabs = tabs.filter(x => !x.isClosing);
    let index = notClosingTabs.indexOf(tab);

    tab.isClosing = true;
    if (notClosingTabs.length - 1 === index) {
      const previousTab = tabs[index - 1];
      tab.setLeft(previousTab.getNewLeft() + tab.getWidth(), true);
      store.tabsStore.updateTabsBounds(true);
    }

    tab.setWidth(0, true);
    store.tabsStore.setTabsLefts(true);

    if (selected) {
      index = tabs.indexOf(tab);

      if (index + 1 < tabs.length && !tabs[index + 1].isClosing) {
        const nextTab = tabs[index + 1];
        nextTab.select();
      } else if (index - 1 >= 0 && !tabs[index - 1].isClosing) {
        const prevTab = tabs[index - 1];
        prevTab.select();
      } else if (store.tabsStore.tabs.length === 1) {
        closeWindow();
      }
    }

    setTimeout(() => {
      store.tabsStore.removeTab(tab.id);
    }, TAB_ANIMATION_DURATION * 1000);
  };

  public onMouseOver = () => {
    this.props.tab.hovered = true;
  };

  public onMouseLeave = () => (this.props.tab.hovered = false);

  public render() {
    const { tab, children } = this.props;
    const { title, isClosing, hovered, favicon, loading } = tab;
    const { tabs, selectedTab } = store.tabsStore;

    const selected = selectedTab === tab.id;
    const tabIndex = tabs.indexOf(tab);

    let rightBorderVisible = true;

    if (
      hovered ||
      selected ||
      ((tabIndex + 1 !== tabs.length &&
        (tabs[tabIndex + 1].hovered ||
          selectedTab === tabs[tabIndex + 1].id)) ||
        tabIndex === tabs.length - 1)
    ) {
      rightBorderVisible = false;
    }

    return (
      <StyledTab
        selected={selected}
        hovered={hovered}
        onMouseDown={this.onMouseDown}
        onMouseOver={this.onMouseOver}
        onMouseLeave={this.onMouseLeave}
        borderVisible={rightBorderVisible}
        isClosing={isClosing}
        innerRef={(r: HTMLDivElement) => (tab.ref = r)}
      >
        <Content hovered={hovered} selected={selected}>
          {!loading && <Icon favicon={favicon.trim()} />}
          <Title selected={selected} loading={loading} favicon={favicon}>
            {title}
          </Title>
        </Content>
        <Close
          onMouseDown={this.onCloseMouseDown}
          onClick={this.onCloseClick}
          hovered={hovered}
          selected={selected}
        >
          <Circle />
        </Close>
        {children}
      </StyledTab>
    );
  }
}
