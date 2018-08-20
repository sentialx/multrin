import { observer } from "mobx-react";
import React from "react";
import { observe } from "mobx";

import { AddTab, StyledTabbar, TabsContainer } from "./styles";
import HorizontalScrollbar from "../HorizontalScrollbar";
import store from "@app/store";
import { TAB_ANIMATION_DURATION, TOOLBAR_HEIGHT } from "~/constants";
import { icons } from "~/defaults";
import Tabs from "@app/components/Tabs";

@observer
export default class Tabbar extends React.Component {
  public componentDidMount() {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);

    observe(store.tabsStore.tabs, (change: any) => {
      if (change.addedCount > 0 && change.removedCount === 0) {
        if (store.tabsStore.scrollbarRef) {
          store.tabsStore.scrollbarRef.scrollToEnd(
            TAB_ANIMATION_DURATION * 1000
          );
        }
      }
    });
  }

  public componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousemove", this.onMouseMove);
  }

  public onMouseUp = () => {
    const selectedTab = store.tabsStore.getSelectedTab();

    store.tabsStore.isDragging = false;
    store.tabsStore.setTabsLefts(true);

    if (selectedTab) {
      selectedTab.isDragging = false;
    }
  };

  public onMouseMove = (e: any) => {
    const selectedTab = store.tabsStore.getSelectedTab();

    if (store.tabsStore.isDragging) {
      const container = store.tabsStore.containerRef;
      const {
        tabStartX,
        mouseStartX,
        lastMouseX,
        lastScrollLeft
      } = store.tabsStore;

      const boundingRect = container.getBoundingClientRect();

      if (Math.abs(e.pageX - mouseStartX) < 5) {
        return;
      }

      selectedTab.isDragging = true;

      const newLeft =
        tabStartX +
        e.pageX -
        mouseStartX -
        (lastScrollLeft - container.scrollLeft);

      let left = Math.max(0, newLeft);

      if (
        newLeft + selectedTab.width >
        store.addTabStore.left + container.scrollLeft
      ) {
        left = store.addTabStore.left - selectedTab.width + lastScrollLeft;
      }

      selectedTab.setLeft(left, false);

      if (
        e.pageY > TOOLBAR_HEIGHT + 16 ||
        e.pageY < -16 ||
        e.pageX < boundingRect.left ||
        e.pageX - boundingRect.left > store.addTabStore.left
      ) {
        // TODO: Create a new window
      }

      store.tabsStore.getTabsToReplace(
        selectedTab,
        lastMouseX - e.pageX >= 1 ? "left" : "right"
      );

      store.tabsStore.lastMouseX = e.pageX;
    }
  };

  public onResize = (e: Event) => {
    if (e.isTrusted) {
      store.tabsStore.updateTabsBounds(false);
    }
  };

  public onAddTabClick = () => {
    store.tabsStore.addTab();
  };

  public getContainer = () => {
    return store.tabsStore.containerRef;
  };

  public onMouseEnter = () => {
    store.tabsStore.scrollbarVisible = true;
  };

  public onMouseLeave = () => {
    store.tabsStore.scrollbarVisible = false;
  };

  public render() {
    return (
      <StyledTabbar>
        <TabsContainer
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
          innerRef={r => (store.tabsStore.containerRef = r)}
        >
          <Tabs />
        </TabsContainer>
        <HorizontalScrollbar
          ref={r => (store.tabsStore.scrollbarRef = r)}
          visible={store.tabsStore.scrollbarVisible}
          getContainer={this.getContainer}
        />
        <AddTab
          icon={icons.add}
          onClick={this.onAddTabClick}
          divRef={r => (store.addTabStore.ref = r)}
        />
      </StyledTabbar>
    );
  }
}
