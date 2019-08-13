import { observer } from 'mobx-react-lite';
import * as React from 'react';
import { platform } from 'os';

import store from '~/renderer/views/app/store';
import { StyledToolbar } from './style';
import { Tabbar } from '../Tabbar';
import { ToolbarButton } from '../ToolbarButton';
import { icons } from '../../constants';
import { ipcRenderer } from 'electron';
import { WindowsControls } from 'react-windows-controls';
import { closeWindow, minimizeWindow, maximizeWindow } from '../../utils';

const onUpdateClick = () => {
  ipcRenderer.send('update-install');
};

const onMenuClick = () => {
  ipcRenderer.send(`menu-toggle-${store.windowId}`);
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
        icon={icons.more}
        size={18}
        style={{ marginRight: 16 }}
        onClick={onMenuClick}
      />
      {platform() !== 'darwin' && (
        <WindowsControls
          style={{ WebkitAppRegion: 'no-drag' }}
          onMouseUp={(e: any) => e.stopPropagation()}
          onClose={closeWindow}
          onMaximize={maximizeWindow}
          onMinimize={minimizeWindow}
          dark={store.isDark}
        />
      )}
    </StyledToolbar>
  );
});
