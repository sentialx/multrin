import { observable } from 'mobx';
import { Tab, Page } from '../models';
import { defaultCreateTabProperties } from '~/defaults/create-tab-properties';
import { TAB_ANIMATION_EASING, TAB_ANIMATION_DURATION } from '~/constants';
import { TweenLite } from 'gsap';
import HorizontalScrollbar from '@app/components/HorizontalScrollbar';
import store from '@app/store';

export class TabsStore {
  @observable
  public isDragging: boolean = false;

  @observable
  public scrollbarVisible: boolean = false;

  @observable
  public tabs: Tab[] = [];

  @observable
  public selectedTab: number;

  public lastScrollLeft: number = 0;
  public lastMouseX: number = 0;
  public mouseStartX: number = 0;
  public tabStartX: number = 0;

  public scrollbarRef: HorizontalScrollbar;
  public containerRef: HTMLDivElement;

  private rearrangeTabsTimer = {
    canReset: false,
    time: 0,
    interval: null as any,
  };

  constructor() {
    this.rearrangeTabsTimer.interval = setInterval(() => {
      // Set widths and positions for tabs 3 seconds after a tab was closed
      if (
        this.rearrangeTabsTimer.canReset &&
        this.rearrangeTabsTimer.time === 3
      ) {
        this.updateTabsBounds(true);
        this.rearrangeTabsTimer.canReset = false;
      }
      this.rearrangeTabsTimer.time++;
    }, 1000);
  }

  public resetRearrangeTabsTimer() {
    this.rearrangeTabsTimer.time = 0;
    this.rearrangeTabsTimer.canReset = true;
  }

  public getContainerWidth() {
    if (this.containerRef) return this.containerRef.offsetWidth;
    return 0;
  }

  public getSelectedTab() {
    return this.getTabById(this.selectedTab);
  }

  public getTabById(id: number) {
    return this.tabs.find(x => x.id === id);
  }

  public updateTabsBounds(animation: boolean) {
    this.setTabsWidths(animation);
    this.setTabsLefts(animation);
  }

  public setTabsWidths(animation: boolean) {
    const tabs = this.tabs.filter(x => !x.isClosing);

    for (const tab of tabs) {
      tab.setWidth(tab.getWidth(), animation);
    }
  }

  public setTabsLefts(animation: boolean) {
    const tabs = this.tabs.filter(x => !x.isClosing);
    const tabbarWidth = store.tabsStore.getContainerWidth();

    let left = 0;

    for (const tab of tabs) {
      tab.setLeft(left, animation);
      left += tab.width + 2;
    }

    store.addTabStore.setLeft(Math.min(left, tabbarWidth), animation);
  }

  public replaceTab(firstTab: Tab, secondTab: Tab) {
    const tabsCopy = this.tabs.slice();

    const firstIndex = tabsCopy.indexOf(firstTab);
    const secondIndex = tabsCopy.indexOf(secondTab);

    tabsCopy[firstIndex] = secondTab;
    tabsCopy[secondIndex] = firstTab;

    secondTab.setLeft(firstTab.getLeft(), true);
    (this.tabs as any).replace(tabsCopy);
  }

  public getTabsToReplace(callingTab: Tab, direction: string) {
    const index = this.tabs.indexOf(callingTab);

    if (direction === 'left') {
      for (let i = index; i--;) {
        const tab = this.tabs[i];
        if (callingTab.left <= tab.width / 2 + tab.left) {
          this.replaceTab(this.tabs[i + 1], tab);
        } else {
          break;
        }
      }
    } else if (direction === 'right') {
      for (let i = index + 1; i < this.tabs.length; i++) {
        const tab = this.tabs[i];
        if (callingTab.left + callingTab.width >= tab.width / 2 + tab.left) {
          this.replaceTab(this.tabs[i - 1], tab);
        } else {
          break;
        }
      }
    }
  }

  public addTab({ active } = defaultCreateTabProperties) {
    const tab = new Tab();
    this.tabs.push(tab);

    const page = new Page(tab.id);
    store.pagesStore.pages.push(page);

    if (active) {
      tab.select();
    }

    return tab;
  }

  public removeTab(id: number) {
    (this.tabs as any).replace(this.tabs.filter(x => x.id !== id));
  }

  public animateProperty(
    property: string,
    ref: HTMLDivElement,
    value: number,
    animation: boolean,
  ) {
    if (ref) {
      const props: any = {
        ease: animation ? TAB_ANIMATION_EASING : null,
      };
      props[property] = value;
      TweenLite.to(ref, animation ? TAB_ANIMATION_DURATION : 0, props);
    }
  }
}
