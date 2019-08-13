import { observable, computed } from 'mobx';
import * as React from 'react';
import { ipcRenderer } from 'electron';
import * as Vibrant from 'node-vibrant';

import store from '~/renderer/app/store';
import { TABS_PADDING, TAB_ANIMATION_DURATION } from '~/renderer/app/constants';
import { getColorBrightness } from '../utils';
import { colors } from '~/renderer/constants';

let pos = 0;

export class Tab {
  @observable
  public id: number;

  @observable
  public isDragging: boolean = false;

  @observable
  public title: string = 'New tab';

  @observable
  public favicon: string = '';

  @observable
  public width: number = 0;

  @observable
  public position = pos++;

  @observable
  public background: string = colors.teal['500'];

  @observable
  public _inputVisible = false;

  public left = 0;
  public tempPosition = pos++;
  public isClosing = false;
  public ref = React.createRef<HTMLDivElement>();
  public inputRef = React.createRef<HTMLInputElement>();
  public removeTimeout: any;

  @computed
  public get inputVisible() {
    return this._inputVisible;
  }

  public set inputVisible(toggle: boolean) {
    store.setAutoFocus(!toggle);
    this._inputVisible = toggle;

    if (toggle) {
      requestAnimationFrame(() => {
        this.inputRef.current.value = this.title;
        this.inputRef.current.focus();
        this.inputRef.current.select();
      });
    }
  }

  @computed
  public get isSelected() {
    return store.tabsStore.selectedTabId === this.id;
  }

  @computed
  public get isHovered() {
    return store.tabsStore.hoveredTabId === this.id;
  }

  @computed
  public get borderVisible() {
    const { nextTab } = this;

    if (
      (nextTab && (nextTab.isHovered || nextTab.isSelected)) ||
      this.isSelected ||
      this.isHovered
    ) {
      return false;
    }

    return true;
  }

  @computed
  public get isExpanded() {
    return this.isHovered || this.isSelected || !store.tabsStore.scrollable;
  }

  @computed
  public get isIconSet() {
    return this.favicon !== '';
  }

  public constructor(id: number, title: string, icon: Buffer) {
    this.id = id;
    this.title = title;
    this.favicon = URL.createObjectURL(new Blob([icon]));

    Vibrant.from(icon)
      .getPalette()
      .then(palette => {
        if (getColorBrightness(palette.Vibrant.hex) < 170) {
          this.background = palette.Vibrant.hex;
        }
      });

    this.select();
  }

  public get nextTab() {
    const tabs = store.tabsStore.tabs
      .slice()
      .sort((a, b) => a.position - b.position);

    const i = tabs.indexOf(this);
    const nextTab = tabs[i + 1];
    return nextTab;
  }

  public get previousTab() {
    const tabs = store.tabsStore.tabs
      .slice()
      .sort((a, b) => a.position - b.position);

    const i = tabs.indexOf(this);
    const previousTab = tabs[i - 1];
    return previousTab;
  }

  public select() {
    if (!this.isClosing) {
      store.tabsStore.selectedTabId = this.id;

      ipcRenderer.send('select-window', this.id);
    }
  }

  public getWidth(containerWidth: number = null, tabs: Tab[] = null) {
    if (containerWidth === null) {
      containerWidth = store.tabsStore.containerWidth;
    }

    if (tabs === null) {
      tabs = store.tabsStore.tabs.slice();
    }

    const width = containerWidth / tabs.length - TABS_PADDING;

    if (width > 200) {
      return 200;
    }
    if (width < 72) {
      return 72;
    }

    return width;
  }

  public getLeft(reordering: boolean = false, calcNewLeft: boolean = false) {
    const tabs = store.tabsStore.tabs.slice();

    if (reordering) {
      tabs.sort((a, b) => a.tempPosition - b.tempPosition);
    } else {
      tabs.sort((a, b) => a.position - b.position);
    }

    const index = tabs.indexOf(this);

    let left = 0;
    for (let i = 0; i < index; i++) {
      left += (calcNewLeft ? this.getWidth() : tabs[i].width) + TABS_PADDING;
    }

    return left;
  }

  public setLeft(left: number, animation: boolean) {
    store.tabsStore.animateProperty('x', this.ref.current, left, animation);
    this.left = left;
  }

  public setWidth(width: number, animation: boolean) {
    store.tabsStore.animateProperty(
      'width',
      this.ref.current,
      width,
      animation,
    );
    this.width = width;
  }

  public close() {
    const tabs = store.tabsStore.tabs
      .slice()
      .sort((a, b) => a.position - b.position);

    ipcRenderer.send('detach-window', this.id);

    const selected = store.tabsStore.selectedTabId === this.id;

    const notClosingTabs = tabs.filter(x => !x.isClosing);
    let index = notClosingTabs.indexOf(this);

    store.tabsStore.resetRearrangeTabsTimer();

    this.isClosing = true;
    if (notClosingTabs.length - 1 === index) {
      const previousTab = tabs[index - 1];
      if (previousTab) {
        this.setLeft(previousTab.getLeft(false, true) + this.getWidth(), true);
      }
      store.tabsStore.updateTabsBounds(true);
    }

    this.setWidth(0, true);
    store.tabsStore.setTabsLefts(true);

    if (selected) {
      index = tabs.indexOf(this);

      if (
        index + 1 < tabs.length &&
        !tabs[index + 1].isClosing &&
        !store.tabsStore.scrollable
      ) {
        const nextTab = tabs[index + 1];
        nextTab.select();
      } else if (index - 1 >= 0 && !tabs[index - 1].isClosing) {
        const prevTab = tabs[index - 1];
        prevTab.select();
      }
    }

    this.removeTimeout = setTimeout(() => {
      store.tabsStore.removeTab(this);
    }, TAB_ANIMATION_DURATION * 1000);
  }
}
