import styled from 'styled-components';

import { TOOLBAR_HEIGHT } from '~/renderer/views/app/constants/design';
import { platform } from 'os';

export const StyledToolbar = styled.div`
  position: relative;
  z-index: 100;
  display: flex;
  flex-flow: row;
  color: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: ${TOOLBAR_HEIGHT}px;

  padding-left: ${platform() === 'darwin' ? 78 : 0}px;
`;
