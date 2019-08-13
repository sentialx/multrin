import * as React from 'react';

import { colors } from '~/renderer/constants';
import { StyledSwitch, Thumb } from './styles';
import { observer } from 'mobx-react-lite';

interface Props {
  color?: string;
  onChange?: (value: boolean) => void;
  value?: boolean;
}

export const Switch = observer(({ color, value }: Props) => {
  return (
    <StyledSwitch activated={value} color={color}>
      <Thumb activated={value} color={color} />
    </StyledSwitch>
  );
});

(Switch as any).defaultProps = {
  color: colors.blue['500'],
};
