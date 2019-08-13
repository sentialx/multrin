import * as React from 'react';
import { observer } from 'mobx-react-lite';

import {
  Line,
  MenuItem,
  MenuItems,
  Content,
  Icon,
  MenuItemTitle,
  Shortcut,
} from './style';
import { icons } from '~/renderer/views/app/constants/icons';
import { ipcRenderer } from 'electron';
import store from '../../store';
import { Switch } from '~/renderer/components/Switch';

const onChangeIconClick = () => {
  ipcRenderer.send(`change-icon-${store.id}`);
};

const onDarkClick = () => {
  store.settings.dark = !store.settings.dark;
  store.saveSettings();
};

export const QuickMenu = observer(() => {
  return (
    <div
      style={{
        display: 'flex',
        flexFlow: 'column',
      }}
    >
      <Content>
        <MenuItems>
          <MenuItem onClick={onChangeIconClick}>
            <Icon icon={icons.photo}></Icon>
            <MenuItemTitle>Change window icon</MenuItemTitle>
          </MenuItem>
          <MenuItem onClick={onDarkClick}>
            <Icon icon={icons.theme}></Icon>
            <MenuItemTitle>Dark theme</MenuItemTitle>
            <Switch value={store.settings.dark} />
          </MenuItem>
        </MenuItems>
      </Content>
    </div>
  );
});
