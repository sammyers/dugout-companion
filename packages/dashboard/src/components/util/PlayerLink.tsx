import React, { FC } from 'react';
import { Text } from 'grommet';
import { useMatch } from 'react-router-dom';

import { AnchorLink } from '@sammyers/dc-shared';

import { extractPlayerName, PlayerRecord } from '../../utils';

interface Props extends PlayerRecord {
  color?: string;
}

const PlayerLink: FC<Props> = ({ color = 'accent-3', ...props }) => {
  const homePageMatch = useMatch({ path: '/g/:groupSlug', end: true });
  const name = extractPlayerName(props);
  if (props.player) {
    return (
      <Text>
        <AnchorLink
          to={`${homePageMatch ? '' : '../'}player/${props.player.id}`}
          defaultColor={color}
          weight="bold"
        >
          {name}
        </AnchorLink>
      </Text>
    );
  }
  return <Text weight="bold">{name}</Text>;
};

export default PlayerLink;
