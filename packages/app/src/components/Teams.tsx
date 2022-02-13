import React, { ChangeEvent, useCallback } from 'react';
import { Box, Button, CheckBox, Text, TextInput } from 'grommet';
import { Transaction } from 'grommet-icons';
import { DragDropContext, DragDropContextProps } from 'react-beautiful-dnd';

import { TeamRole } from '@sammyers/dc-shared';

import Lineup from './Lineup';
import ShuffleIcon from './prompts/util/ShuffleIcon';
import GameLengthSelector from './GameLengthSelector';
import StartButton from './StartButton';
import OptionSelector from './prompts/util/OptionSelector';
import LineupEditControls from './LineupEditControls';

import {
  canReorderPlayer,
  getOpponentTeamName,
  getOpponentTeamSize,
  getProtagonistTeamRole,
  isGameInProgress,
  isSoloModeActive,
} from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { useStore } from 'react-redux';
import { AppState } from 'state/store';

const ButtonContainer = () => {
  const dispatch = useAppDispatch();

  const gameInProgress = useAppSelector(isGameInProgress);

  const handleFlipTeams = useCallback(() => {
    dispatch(gameActions.flipTeams());
  }, [dispatch]);

  const handleShuffleTeams = useCallback(() => {
    dispatch(gameActions.shuffleTeams());
  }, [dispatch]);

  return (
    <Box
      style={{ position: 'absolute', top: 0 }}
      margin={{ horizontal: 'auto', vertical: 'medium' }}
    >
      {gameInProgress ? (
        <LineupEditControls />
      ) : (
        <Box direction="row" gap="xsmall">
          <Button key="flip" plain={false} icon={<Transaction />} onClick={handleFlipTeams} />
          <Button key="shuffle" plain={false} icon={<ShuffleIcon />} onClick={handleShuffleTeams} />
        </Box>
      )}
    </Box>
  );
};

const SoloModeMenu = () => {
  const dispatch = useAppDispatch();

  const opponentName = useAppSelector(getOpponentTeamName);
  const opponentTeamSize = useAppSelector(getOpponentTeamSize);
  const teamRole = useAppSelector(getProtagonistTeamRole);
  const inProgress = useAppSelector(isGameInProgress);

  const handleRoleChange = useCallback(() => {
    dispatch(gameActions.flipTeams());
  }, [dispatch]);

  const handleChangeOpponentTeamName = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => {
      dispatch(gameActions.changeOpponentTeamName(target.value));
    },
    [dispatch]
  );

  const handleChangeOpponentTeamSize = useCallback(
    (value: 'large' | 'small') => {
      dispatch(gameActions.changeOpponentTeamSize(value));
    },
    [dispatch]
  );

  return (
    <Box round="small" background="neutral-5" pad="medium" gap="medium" justify="between">
      {!inProgress && (
        <Box align="center" direction="row" gap="small" justify="center">
          <Text
            size="small"
            style={{ cursor: 'pointer' }}
            onClick={teamRole === TeamRole.HOME ? handleRoleChange : undefined}
          >
            Away
          </Text>
          <CheckBox toggle checked={teamRole === TeamRole.HOME} onChange={handleRoleChange} />
          <Text
            size="small"
            style={{ cursor: 'pointer' }}
            onClick={teamRole === TeamRole.AWAY ? handleRoleChange : undefined}
          >
            Home
          </Text>
        </Box>
      )}
      <GameLengthSelector />
      <Box gap="small">
        <Box gap="xsmall">
          <Text alignSelf="center">Opponent Name</Text>
          <TextInput value={opponentName ?? ''} onChange={handleChangeOpponentTeamName} />
        </Box>
        <Box gap="xsmall">
          <Text alignSelf="center">Opponent Team Size</Text>
          <OptionSelector
            multiple={false}
            selectedColor="accent-1"
            options={[
              { label: '≤ 9', value: 'small' },
              { label: '≥ 10', value: 'large' },
            ]}
            value={opponentTeamSize}
            onChange={handleChangeOpponentTeamSize}
          />
        </Box>
      </Box>
      {!inProgress && <StartButton size="large" />}
    </Box>
  );
};

const Teams = () => {
  const dispatch = useAppDispatch();
  const store = useStore<AppState>();

  const inSoloMode = useAppSelector(isSoloModeActive);
  const protagonistRole = useAppSelector(getProtagonistTeamRole);

  const handleDragEnd: DragDropContextProps['onDragEnd'] = useCallback(
    ({ source, destination }) => {
      if (!destination) return;
      const state = store.getState();
      const fromTeam = TeamRole[source.droppableId as keyof typeof TeamRole];
      const toTeam = TeamRole[destination.droppableId as keyof typeof TeamRole];
      if (
        !canReorderPlayer(state, fromTeam, source.index) ||
        !canReorderPlayer(state, toTeam, destination.index)
      ) {
        return;
      }
      dispatch(
        gameActions.movePlayer({
          fromTeam,
          toTeam,
          startIndex: source.index,
          endIndex: destination.index,
        })
      );
    },
    [dispatch, store]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {inSoloMode ? (
        <Box direction="row" pad="medium" gap="medium" flex={{ shrink: 0, grow: 1 }}>
          <Lineup teamRole={protagonistRole} />
          <SoloModeMenu />
        </Box>
      ) : (
        <Box
          direction="row"
          justify="around"
          pad="medium"
          gap="medium"
          flex={{ shrink: 0 }}
          basis="auto"
          style={{ position: 'relative' }}
        >
          <Lineup teamRole={TeamRole.AWAY} />
          <ButtonContainer />
          <Lineup teamRole={TeamRole.HOME} />
        </Box>
      )}
    </DragDropContext>
  );
};

export default Teams;
