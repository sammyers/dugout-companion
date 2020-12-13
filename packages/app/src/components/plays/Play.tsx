import React, { FC } from 'react';
import { Text, Box } from 'grommet';

import { PlateAppearanceType } from '@dugout-companion/shared';

import { getPlateAppearanceLabel } from 'utils/labels';

import { PlayDescription } from 'state/plays/types';

const PlayTypeTag: FC<{ type: PlateAppearanceType }> = ({ type }) => {
  let background = '';
  switch (type) {
    case PlateAppearanceType.WALK:
      background = 'neutral-1';
      break;
    case PlateAppearanceType.OUT:
    case PlateAppearanceType.FIELDERS_CHOICE:
    case PlateAppearanceType.DOUBLE_PLAY:
      background = 'neutral-4';
      break;
    default:
      background = 'neutral-3';
      break;
  }
  return (
    <Box
      round={{ size: '2px' }}
      background={background}
      alignSelf="center"
      pad={{ vertical: 'xxsmall', horizontal: 'xsmall' }}
      flex={false}
    >
      <Text size="xsmall">{getPlateAppearanceLabel(type).toUpperCase()}</Text>
    </Box>
  );
};

// NOTE: make sure scoring teams are in the right order
const ScoreTag: FC<{ score: number[] }> = ({ score: [away, home] }) => (
  <Box
    round={{ size: '2px' }}
    border
    alignSelf="start"
    pad={{ vertical: 'xxsmall', horizontal: 'xsmall' }}
    flex={false}
    margin={{ top: 'xsmall' }}
  >
    <Text size="xsmall">
      AWAY {away} - HOME {home}
    </Text>
  </Box>
);

const Play: FC<PlayDescription> = ({ description, outs, score, type }) => (
  <Box pad={{ vertical: 'small' }} direction="row" justify="between" gap="xsmall">
    <Box>
      <Text>
        <Text>{description}</Text>
        {outs && (
          <Text weight="bold" margin={{ left: 'xsmall' }}>
            {outs} {outs > 1 ? 'outs' : 'out'}{' '}
          </Text>
        )}
      </Text>
      {score && <ScoreTag score={score} />}
    </Box>
    {type && <PlayTypeTag type={type} />}
  </Box>
);

export default Play;
