import styled from 'styled-components';

export const StyledApp = styled.div`
  border: 1px solid rgba(0, 0, 0, 0.12);
  overflow: hidden;
  position: relative;
  background-color: ${(props: any) => (props.theme.dark ? '#2b2b2b' : 'white')};
  color: ${(props: any) => (props.theme.dark ? '#fff' : '#000')};
  height: 100vh;
  padding: 8px;
`;

export const Title = styled.div`
  font-size: 16px;
`;

export const Subtitle = styled.div`
  font-size: 13px;
  opacity: 0.54;
  margin-top: 8px;
`;

export const Buttons = styled.div`
  display: flex;
  margin-top: 16px;
  float: right;
`;
