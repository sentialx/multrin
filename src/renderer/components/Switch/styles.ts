import styled, { css } from 'styled-components';

import { centerVertical } from '~/shared/mixins';

interface Props {
  activated: boolean;
  color: string;
}

export const StyledSwitch = styled.div`
  width: 40px;
  height: 20px;
  border-radius: 32px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: 0.15s background-color;

  &:after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
  }

  ${({ activated, color }: Props) => css`
    background-color: ${activated ? color : 'rgba(0, 0, 0, 0.16)'};
  `}
`;

export const Thumb = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 100%;
  position: absolute;
  z-index: 3;
  transition: 0.15s left;
  ${centerVertical()};

  ${({ activated }: { activated: boolean }) => css`
    left: ${activated ? 22 : 2}px;
    background-color: #fff;
  `}
`;
