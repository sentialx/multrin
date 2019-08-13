import { observer } from 'mobx-react';
import * as React from 'react';

import { Tab } from '~/renderer/app/models';
import store from '~/renderer/app/store';
import {
  StyledTab,
  StyledContent,
  StyledIcon,
  StyledTitle,
  StyledClose,
  StyledBorder,
  StyledOverlay,
  StyledInput,
} from './style';
import { shadeBlendConvert } from '../../utils';
import { remote } from 'electron';

const removeTab = (tab: Tab) => () => {
  tab.close();
};

const onContextMenu = (tab: Tab) => () => {
  const { tabs } = store.tabsStore;

  const menu = remote.Menu.buildFromTemplate([
    {
      label: 'Edit title',
      click: () => {
        tab.inputVisible = true;
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Close tab',
      click: () => {
        tab.close();
      },
    },
    {
      label: 'Close other tabs',
      click: () => {
        for (const t of tabs) {
          if (t !== tab) {
            t.close();
          }
        }
      },
    },
    {
      label: 'Close tabs from left',
      click: () => {
        for (let i = tabs.indexOf(tab) - 1; i >= 0; i--) {
          tabs[i].close();
        }
      },
    },
    {
      label: 'Close tabs from right',
      click: () => {
        for (let i = tabs.length - 1; i > tabs.indexOf(tab); i--) {
          tabs[i].close();
        }
      },
    },
  ]);

  menu.popup();
};

const onCloseMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
  e.stopPropagation();
};

const onMouseDown = (tab: Tab) => (e: React.MouseEvent<HTMLDivElement>) => {
  const { pageX } = e;

  tab.select();

  store.tabsStore.lastMouseX = 0;
  store.tabsStore.isDragging = true;
  store.tabsStore.mouseStartX = pageX;
  store.tabsStore.tabStartX = tab.left;

  store.tabsStore.lastScrollLeft =
    store.tabsStore.containerRef.current.scrollLeft;
};

const onMouseEnter = (tab: Tab) => () => {
  if (!store.tabsStore.isDragging) {
    store.tabsStore.hoveredTabId = tab.id;
  }
};

const onMouseLeave = () => {
  store.tabsStore.hoveredTabId = -1;
};

const applyEdit = (tab: Tab) => {
  tab.title = tab.inputRef.current.value;
  tab.inputVisible = false;
};

const onInputBlur = (tab: Tab) => () => {
  applyEdit(tab);
};

const onKeyPress = (tab: Tab) => (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    applyEdit(tab);
  }
};

const onDragOver = (tab: Tab) => () => {
  tab.select();
};

const Content = observer(({ tab }: { tab: Tab }) => {
  return (
    <StyledContent collapsed={tab.isExpanded}>
      {tab.favicon !== '' && (
        <StyledIcon
          isIconSet={tab.favicon !== ''}
          style={{ backgroundImage: `url(${tab.favicon})` }}
        />
      )}
      <StyledInput
        onBlur={onInputBlur(tab)}
        onKeyPress={onKeyPress(tab)}
        ref={tab.inputRef}
        style={{ display: tab.inputVisible ? 'block' : 'none' }}
      ></StyledInput>
      <StyledTitle
        isIcon={tab.isIconSet}
        style={{
          color: store.foreground,
        }}
      >
        {tab.title}
      </StyledTitle>
    </StyledContent>
  );
});

const Close = observer(({ tab }: { tab: Tab }) => {
  return (
    <StyledClose
      onMouseDown={onCloseMouseDown}
      onClick={removeTab(tab)}
      visible={tab.isExpanded}
    />
  );
});

const Border = observer(({ tab }: { tab: Tab }) => {
  return <StyledBorder visible={tab.borderVisible} />;
});

const Overlay = observer(({ tab }: { tab: Tab }) => {
  return (
    <StyledOverlay
      hovered={tab.isHovered}
      style={{
        backgroundColor: tab.isSelected
          ? shadeBlendConvert(
              store.isDark ? 0.3 : 0.5,
              tab.background,
              store.background,
            )
          : store.isDark
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(0, 0, 0, 0.04)',
      }}
    />
  );
});

export default observer(({ tab }: { tab: Tab }) => {
  return (
    <StyledTab
      onDragOver={onDragOver(tab)}
      selected={tab.isSelected}
      hovered={tab.isHovered}
      onContextMenu={onContextMenu(tab)}
      onMouseDown={onMouseDown(tab)}
      onMouseEnter={onMouseEnter(tab)}
      onMouseLeave={onMouseLeave}
      isClosing={tab.isClosing}
      ref={tab.ref}
      style={{
        backgroundColor: tab.isSelected
          ? shadeBlendConvert(
              store.isDark ? 0.4 : 0.6,
              tab.background,
              store.background,
            )
          : 'transparent',
      }}
    >
      <Content tab={tab} />
      <Close tab={tab} />
      <Border tab={tab} />
      <Overlay tab={tab} />
    </StyledTab>
  );
});
