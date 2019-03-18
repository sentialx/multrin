import { observer } from 'mobx-react';
import * as React from 'react';
import { platform } from 'os';

import store from '~/renderer/app/store';
import { StyledToolbar } from './style';
import { WindowsButtons } from '../WindowsButtons';
import { Tabbar } from '../Tabbar';
import ToolbarButton from '../ToolbarButton';
import { icons } from '../../constants';
import { ipcRenderer } from 'electron';

const onUpdateClick = () => {
  ipcRenderer.send('update-install');
};

const onThemeClick = () => {
  store.isDark = !store.isDark;
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
      {platform() !== 'darwin' && <WindowsButtons />}
    </StyledToolbar>
  );
});
