import React, { FC } from 'react';
import { Text } from 'grommet';

import { AnchorLink } from '@sammyers/dc-shared';

import { extractPlayerName, PlayerRecord } from '../../utils';

interface Props extends PlayerRecord {
  color?: string;
}

const PlayerLink: FC<Props> = ({ color = 'accent-3', ...props }) => {
  const name = extractPlayerName(props);
  if (props.player) {
    return (
      <Text>
        <AnchorLink to={`/player/${props.player.id}`} defaultColor={color} weight="bold">
          {name}
        </AnchorLink>
      </Text>
    );
  }
  return <Text weight="bold">{name}</Text>;
};

export default PlayerLink;
