import { observer } from 'mobx-react';
import * as React from 'react';
import { platform } from 'os';

import store from '~/renderer/app/store';
import { StyledToolbar } from './style';
import { Tabbar } from '../Tabbar';
import ToolbarButton from '../ToolbarButton';
import { icons } from '../../constants';
import { ipcRenderer } from 'electron';
import { WindowsControls } from 'react-windows-controls';
import { closeWindow, minimizeWindow, maximizeWindow } from '../../utils';

const onUpdateClick = () => {
  ipcRenderer.send('update-install');
};

const onThemeClick = () => {
  store.isDark = !store.isDark;
  store.settings.dark = store.isDark;
  store.saveSettings();
};

export const Toolbar = observer(() => {
  return (
    <StyledToolbar>
      <Tabbar />
      {store.updateInfo.available && (
        <ToolbarButton
          icon={icons.download}
          style={{ marginRight: 8 }}
          onClick={onUpdateClick}
        />
      )}
      <ToolbarButton
        icon={icons.theme}
        style={{ marginRight: 16 }}
        onClick={onThemeClick}
      />
      {platform() !== 'darwin' && (
        <WindowsControls
          onClose={closeWindow}
          onMaximize={maximizeWindow}
          onMinimize={minimizeWindow}
          dark={store.isDark}
        />
      )}
    </StyledToolbar>
  );
});
