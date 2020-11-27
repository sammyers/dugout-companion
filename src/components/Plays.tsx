import React, { FC, useCallback, useMemo, useState } from 'react';
import { Card, CardHeader, Text, CardBody, Box, Heading, ThemeContext } from 'grommet';
import _ from 'lodash';
import { Redirect } from 'react-router-dom';

import { getInning, isGameInProgress } from 'state/game/selectors';
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
      {plays.map(({ description, outs, score, type }, i) => (
        <Box key={i} pad={{ vertical: 'small' }} direction="row" justify="between" gap="xsmall">
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
  const currentInning = useAppSelector(getInning);

  const [selectedInning, setSelectedInning] = useState(currentInning);

  const allPlaysForInning = useMemo(
    () => allPlays.filter(({ inning }) => inning === selectedInning),
    [allPlays, selectedInning]
  );

  const selectInning = useCallback(
    (inning: number) => () => {
      setSelectedInning(inning);
    },
    [setSelectedInning]
  );

  if (!gameStarted) {
    return <Redirect to="/teams" />;
  }

  return (
    <Box pad="medium" flex={{ shrink: 0 }} basis="auto" gap="small">
      <Box direction="row" justify="between">
        <Heading level={4} margin="none">
          Scoring
        </Heading>
        <Heading level={4} alignSelf="end" margin="none">
          All Plays
        </Heading>
      </Box>
      <Box direction="row" gap="small">
        <Box gap="small" basis="0" flex>
          {scoringPlays.map(group => (
            <InningPlays key={`${group.inning}_${group.halfInning}`} {...group} />
          ))}
        </Box>
        <Box gap="small" basis="0" flex margin={{ left: 'small' }}>
          {!allPlaysForInning.length && <Text alignSelf="center">No plays yet this inning.</Text>}
          {allPlaysForInning.map(group => (
            <InningPlays key={`${group.inning}_${group.halfInning}`} {...group} />
          ))}
        </Box>
        <ThemeContext.Extend value={{ global: { size: { xxsmall: '32px' } } }}>
          <Box gap="xsmall" flex={false}>
            {_.range(1, currentInning + 1).map(inning => (
              <Box
                round={{ size: '4px' }}
                border={{ size: 'small' }}
                width="xxsmall"
                height="xxsmall"
                justify="center"
                align="center"
                hoverIndicator={!(inning === selectedInning)}
                background={inning === selectedInning ? 'brand' : undefined}
                onClick={selectInning(inning)}
              >
                <Text>{inning}</Text>
              </Box>
            ))}
          </Box>
        </ThemeContext.Extend>
      </Box>
    </Box>
  );
};

export default Plays;
