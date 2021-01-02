import styled, { css } from 'styled-components';

import theme from 'theme';

interface Props {
  active?: boolean;
  occupied?: boolean;
}

const brandColor = theme.global!.colors!.brand as string;

const HoverablePath = styled.path<Props>`
  transition: fill 200ms linear;
  fill: ${({ occupied }) => (occupied ? brandColor : 'white')};

  ${({ active, occupied }) =>
    !(active || occupied) &&
    css`
      cursor: pointer;

      &:hover {
        fill: #dadada;
      }
    `}
`;

export default HoverablePath;
