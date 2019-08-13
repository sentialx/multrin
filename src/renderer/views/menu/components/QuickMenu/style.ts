import styled, { css } from 'styled-components';
import { centerIcon, getLetterSpacing } from '~/shared/mixins';

export const Line = styled.div`
  height: 1px;
  width: 100%;
  margin-top: 4px;
  margin-bottom: 4px;

  background-color: rgba(0, 0, 0, 0.12);
`;

export const MenuItem = styled.div`
  height: 36px;
  align-items: center;
  display: flex;
  position: relative;
  padding: 0 16px;
  font-size: 12px;
  letter-spacing: ${getLetterSpacing(12, 0.1)}rem;
  cursor: default;

  &:hover {
    background-color: ${(props: any) =>
      props.theme.dark ? `rgba(255, 255, 255, 0.03)` : `rgba(0, 0, 0, 0.03)`};
  }
`;

export const MenuItemTitle = styled.div`
  flex: 1;
`;

export const MenuItems = styled.div`
  flex: 1;
  overflow: hidden;
  padding-top: 8px;
  padding-bottom: 8px;
`;

export const Content = styled.div`
  display: flex;
  flex-flow: column;
  position: relative;
`;

export const Icon = styled.div`
  margin-right: 16px;
  width: 20px;
  height: 20px;
  ${centerIcon()};
  opacity: 0.8;
  ${({ icon, theme }: { icon?: string; theme?: any }) => css`
    background-image: url(${icon});
    filter: ${theme.dark ? 'invert(100%)' : 'none'};
  `};
`;

export const Shortcut = styled.div`
  opacity: 0.54;
  margin-right: 16px;
`;
