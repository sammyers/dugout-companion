import React, { FC } from 'react';
import { Card, CardHeader, Text, CardBody, Box, Heading } from 'grommet';
import { Redirect } from 'react-router-dom';

import { isGameInProgress } from 'state/game/selectors';
import { HalfInning, PlateAppearanceType } from 'state/game/types';
import { getAllPlays, getScoringPlays } from 'state/plays/selectors';
import { useAppSelector } from 'utils/hooks';
import { getOrdinalInning, getPlateAppearanceLabel } from 'utils/labels';

interface Play {
  description: string;
  type?: PlateAppearanceType;
  outs?: number;
  score?: [number, number];
}

interface InningPlaysProps {
  inning: number;
  halfInning: HalfInning;
  plays: Array<Play>;
}

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

const ScoreTag: FC<{ score: [number, number] }> = ({ score: [away, home] }) => (
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

const InningPlays: FC<InningPlaysProps> = ({ inning, halfInning, plays }) => (
  <Card background="light-1">
    <CardHeader background="light-2" pad="medium">
      <Text>
        {halfInning === HalfInning.TOP ? 'Top' : 'Bottom'} {getOrdinalInning(inning)}
      </Text>
    </CardHeader>
    <CardBody pad={{ horizontal: 'medium', vertical: 'small' }} gap="small" border="between">
      {plays.map(({ description, outs, score, type }) => (
        <Box pad="small" direction="row" justify="between" gap="xsmall">
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
      ))}
    </CardBody>
  </Card>
);

const Plays = () => {
  const gameStarted = useAppSelector(isGameInProgress);
  const scoringPlays = useAppSelector(getScoringPlays);
  const allPlays = useAppSelector(getAllPlays);

  if (!gameStarted) {
    return <Redirect to="/teams" />;
  }

  return (
    <Box
      direction="row"
      justify="around"
      pad="medium"
      gap="medium"
      flex={{ shrink: 0 }}
      basis="auto"
    >
      <Box gap="small" basis="0" flex>
        <Heading level={4} margin="none">
          Scoring
        </Heading>
        {scoringPlays.map(group => (
          <InningPlays {...group} />
        ))}
      </Box>
      <Box gap="small" basis="0" flex>
        <Heading level={4} alignSelf="end" margin="none">
          All Plays
        </Heading>
        {allPlays.map(group => (
          <InningPlays {...group} />
        ))}
      </Box>
    </Box>
  );
};

export default Plays;
