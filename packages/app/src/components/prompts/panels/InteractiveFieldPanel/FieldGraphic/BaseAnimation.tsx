import React, { FC } from 'react';

import theme from 'theme';

const colors = theme.global!.colors!;

interface Props {
  color?: string;
}

const BaseAnimation: FC<Props> = ({ color = 'neutral-3' }) => (
  <animate
    attributeName="fill"
    values={`white; ${colors[color]}; white`}
    begin="0s"
    dur="1.5s"
    fill="freeze"
    repeatCount="indefinite"
  />
);

export default BaseAnimation;
