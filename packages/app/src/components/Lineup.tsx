import React, { useCallback, ChangeEvent, useState } from 'react';
import { Box, Button, Text, TextInput } from 'grommet';
import _ from 'lodash';
import { Droppable } from 'react-beautiful-dnd';

import ShuffleIcon from './prompts/util/ShuffleIcon';
import AddPlayer from './AddPlayer';
import LineupEditControls from './LineupEditControls';
import LineupPlayer from './LineupPlayer';

import {
  getCurrentBatter,
  getFirstBatterNextInning,
  getLineupToEdit,
  getTeamName,
  isGameInProgress,
  isLineupEditable,
  isSoloModeActive,
} from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

import { TeamRole } from '@sammyers/dc-shared';
import SubstitutePlayerModal from './SubstitutePlayerModal';

interface Props {
  teamRole: TeamRole;
}

const Lineup = ({ teamRole }: Props) => {
  const dispatch = useAppDispatch();

  const inProgress = useAppSelector(isGameInProgress);
  const soloMode = useAppSelector(isSoloModeActive);
  const editable = useAppSelector(isLineupEditable);
  const players = useAppSelector(state => getLineupToEdit(state, teamRole));
  const teamName = useAppSelector(state => getTeamName(state, teamRole));
  const playerAtBat = useAppSelector(getCurrentBatter);
  const batterUpNextInning = useAppSelector(getFirstBatterNextInning);

  const handleNameChange = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) =>
      dispatch(gameActions.changeTeamName({ role: teamRole, name: currentTarget.value })),
    [dispatch, teamRole]
  );

  const handleShuffleLineup = useCallback(() => {
    dispatch(gameActions.shuffleLineup(teamRole));
  }, [dispatch, teamRole]);

  const handleAddPlayer = useCallback(
    (playerId: string) => {
      dispatch(gameActions.addPlayerToGame({ teamRole, playerId }));
    },
    [dispatch, teamRole]
  );

  const [playerToSubstitute, setPlayerToSubstitute] = useState<string>();

  return (
    <Box flex>
      <SubstitutePlayerModal
        oldPlayerId={playerToSubstitute}
        onClose={() => setPlayerToSubstitute(undefined)}
      />
      <Box margin={{ bottom: 'medium' }}>
        {soloMode ? (
          <Box direction="row" justify="between" align="center">
            <Text weight="bold">{teamName} Lineup</Text>
            {inProgress ? (
              <LineupEditControls />
            ) : (
              <Button plain={false} icon={<ShuffleIcon />} onClick={handleShuffleLineup} />
            )}
          </Box>
        ) : (
          <Box width="medium" alignSelf="center">
            <TextInput
              value={teamName!}
              onChange={handleNameChange}
              placeholder={teamRole === TeamRole.AWAY ? 'Away Team' : 'Home Team'}
            />
          </Box>
        )}
      </Box>
      {editable && (
        <Box
          direction={teamRole === TeamRole.AWAY ? 'row' : 'row-reverse'}
          align="center"
          gap="small"
        >
          {!soloMode && !inProgress && (
            <Button plain={false} icon={<ShuffleIcon />} onClick={handleShuffleLineup} />
          )}
          <AddPlayer onSelect={handleAddPlayer} />
        </Box>
      )}
      <Box direction="row" margin={{ top: 'small' }}>
        <Box width="24px">
          {_.range(1, Math.max(9, players.length) + 1).map(lineupSpot => (
            <Box key={lineupSpot} height="xxsmall" justify="center" margin={{ vertical: '2px' }}>
              <Text weight="bold" textAlign="center">
                {lineupSpot}
              </Text>
            </Box>
          ))}
        </Box>
        <Droppable
          isDropDisabled={(inProgress && teamRole === TeamRole.AWAY) || !editable}
          droppableId={teamRole === TeamRole.AWAY ? 'AWAY' : 'HOME'}
        >
          {({ innerRef, droppableProps, placeholder }) => (
            <Box ref={innerRef} {...droppableProps} flex>
              {players.map(({ playerId, position }, index) => (
                <LineupPlayer
                  key={`${playerId}-${position}`}
                  playerId={playerId}
                  position={position}
                  index={index}
                  team={teamRole}
                  editable={editable}
                  atBat={playerAtBat === playerId}
                  upNextInning={batterUpNextInning === playerId}
                  onSubstitute={() => setPlayerToSubstitute(playerId)}
                />
              ))}
              {placeholder}
            </Box>
          )}
        </Droppable>
      </Box>
    </Box>
  );
};

export default Lineup;
