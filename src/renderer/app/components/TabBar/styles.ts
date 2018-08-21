import styled, { css } from 'styled-components';

import { TOOLBAR_BUTTON_WIDTH } from '~/constants';
import ToolbarButton from '../ToolbarButton';

export const StyledTabbar = styled.div`
  height: 100%;
  width: calc(100% - 4px);
  margin-left: 2px;
  position: relative;
  overflow: hidden;
`;

export const TabsContainer = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
`;

export const AddTab = styled(ToolbarButton)`
  position: absolute;
  top: 0;
`;
