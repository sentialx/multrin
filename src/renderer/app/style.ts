import { css } from 'styled-components';

import { body2 } from '~/shared/mixins';

export const Style = css`
  body {
    user-select: none;
    cursor: default;
    margin: 0;
    transition: 0.2s background-color;
    background-color: ${(props: any) => props.theme.background};
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    ${body2()}
  }

  * {
    box-sizing: border-box;
  }
`;
