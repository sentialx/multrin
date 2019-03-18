import styled, { css } from 'styled-components';
import { centerImage } from '~/shared/mixins';
import { icons } from '../../constants';

export const Info = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 500;
  font-size: 16px;
  transition: 0.3s opacity;

  ${({ visible }: { visible: boolean }) => css`
    animation-name: ${visible ? 'info-pulse' : 'none'};
    opacity: ${visible ? 0.54 : 0};
  `};

  animation-duration: 3s;
  animation-iteration-count: infinite;
  will-change: transform;

  @keyframes info-pulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
    }
  }
`;

export const Icon = styled.div`
  ${centerImage('64px', '64px')};
  width: 100%;
  height: 96px;
  background-image: url(${icons.dropWindow});
`;

export const Handle = styled.div`
  -webkit-app-region: drag;
  position: absolute;
  top: 3px;
  left: 3px;
  bottom: 3px;
  right: 3px;
`;
