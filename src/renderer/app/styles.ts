import { css } from 'styled-components';
import { fonts } from '~/defaults';
import { body2 } from '@mixins';

export const Style = css`
  body {
    user-select: none;
    cursor: default;
    ${body2()} margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  * {
    box-sizing: border-box;
  }

  @keyframes nersent-ui-preloader-rotate {
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  @keyframes nersent-ui-preloader-dash {
    0% {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -35px;
    }
    100% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -124px;
    }
  }
`;
