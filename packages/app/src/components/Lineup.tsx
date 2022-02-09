import React, { useState, useMemo, useCallback, ChangeEvent } from 'react';
import { Box, Text, TextInput, TextInputProps } from 'grommet';
import _ from 'lodash';
import { Droppable } from 'react-beautiful-dnd';

import {
  TeamRole,
  useCreatePlayerMutation,
  useAddPlayerToGroupMutation,
} from '@sammyers/dc-shared';

import LineupEditControls from './LineupEditControls';
import LineupPlayer from './LineupPlayer';

import {
  getCurrentBatter,
  getFirstBatterNextInning,
  getLineupToEdit,
  getPlayersNotInGame,
  getTeamName,
  isGameInProgress,
  isLineupEditable,
  isSoloModeActive,
} from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getCurrentGroupId } from 'state/groups/selectors';
import { playerActions } from 'state/players/slice';
import { formatName, getNameParts } from 'state/players/utils';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';

const NEW_PLAYER_ID = 'new-player';

interface Props {
  teamRole: TeamRole;
}

const Lineup = ({ teamRole }: Props) => {
  const dispatch = useAppDispatch();

  const inProgress = useAppSelector(isGameInProgress);
  const soloMode = useAppSelector(isSoloModeActive);
  const editable = useAppSelector(isLineupEditable);
  const players = useAppSelector(state => getLineupToEdit(state, teamRole));
  const availablePlayers = useAppSelector(getPlayersNotInGame);
  const groupId = useAppSelector(getCurrentGroupId)!;
  const teamName = useAppSelector(state => getTeamName(state, teamRole));
  const playerAtBat = useAppSelector(getCurrentBatter);
  const batterUpNextInning = useAppSelector(getFirstBatterNextInning);

  const [searchValue, setSearchValue] = useState('');

  const online = useNetworkStatus();

  const [createPlayer] = useCreatePlayerMutation();
  const [addPlayerToGroup] = useAddPlayerToGroupMutation();

  const suggestions = useMemo(() => {
    if (!searchValue.length) return [];

    const existingSuggestions = availablePlayers
      .filter(player => formatName(player).toLowerCase().startsWith(searchValue.toLowerCase()))
      .map(player => ({
        value: player.id,
        label: (
          <Box pad="small">
            <Text>
              {player.firstName} {player.lastName}
            </Text>
          </Box>
        ),
      }));

    if (searchValue.length > 2) {
      return existingSuggestions.concat({
        label: (
          <Box border={{ color: 'status-ok', size: '2px' }} pad="small">
            <Text>Add new player "{searchValue}"</Text>
          </Box>
        ),
        value: NEW_PLAYER_ID,
      });
    }
    return existingSuggestions;
  }, [availablePlayers, searchValue]);

  const handleNameChange = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) =>
      dispatch(gameActions.changeTeamName({ role: teamRole, name: currentTarget.value })),
    [dispatch, teamRole]
  );

  const handleSearchChange = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) => setSearchValue(currentTarget.value),
    [setSearchValue]
  );

  const handleSuggestionSelect: NonNullable<TextInputProps['onSelect']> = useCallback(
    async ({ suggestion }) => {
      if (suggestion) {
        let playerId = suggestion.value;
        if (playerId === NEW_PLAYER_ID) {
          const nameParts = getNameParts(searchValue);
          if (online) {
            const { data } = await createPlayer({
              variables: {
                input: {
                  player: { ...nameParts, playerGroupMemberships: { create: [{ groupId }] } },
                },
              },
            });
            const player = data?.createPlayer?.player;
            if (player) {
              playerId = player.id;
            }
          } else {
            const { payload } = dispatch(
              playerActions.createPlayerOffline({ ...nameParts }, groupId)
            );
            playerId = payload.id;
          }
        } else {
          const player = _.find(availablePlayers, { id: playerId })!;
          if (!_.some(player.groups, { groupId })) {
            // Player not yet a member of the current group
            if (online) {
              await addPlayerToGroup({ variables: { playerId, groupId } });
            } else {
              dispatch(playerActions.addPlayerToGroupOffline({ playerId, groupId }));
            }
          }
        }
        dispatch(gameActions.addPlayerToGame({ teamRole, playerId }));
        setSearchValue('');
      }
    },
    [
      groupId,
      online,
      teamRole,
      availablePlayers,
      dispatch,
      searchValue,
      setSearchValue,
      createPlayer,
      addPlayerToGroup,
    ]
  );

  return (
    <Box flex>
      <Box margin={{ bottom: 'medium' }}>
        {soloMode ? (
          <Box direction="row" justify="between" align="center">
            <Text weight="bold">{teamName} Lineup</Text>
            {inProgress && <LineupEditControls />}
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
        <TextInput
          placeholder="Add Player"
          suggestions={suggestions}
          value={searchValue}
          onChange={handleSearchChange}
          onSelect={handleSuggestionSelect}
        />
      )}
      <Box direction="row" margin={{ top: 'small' }}>
        <Box width="xxsmall">
          {_.range(1, Math.max(9, players.length) + 1).map(lineupSpot => (
            <Box key={lineupSpot} height="xxsmall" justify="center">
              <Text>{lineupSpot}</Text>
            </Box>
          ))}
        </Box>
        <Droppable
          isDropDisabled={!editable}
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
