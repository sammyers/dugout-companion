import React, { useState, useMemo, useCallback, ChangeEvent } from 'react';
import { Box, Text, TextInput, TextInputProps } from 'grommet';
import _ from 'lodash';
import { Droppable } from 'react-beautiful-dnd';

import { TeamRole, useCreatePlayerMutation } from '@sammyers/dc-shared';

import LineupPlayer from './LineupPlayer';

import { getLineupToEdit, getPlayersNotInGame, getTeamName } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getCurrentGroup } from 'state/groups/selectors';
import { playerActions } from 'state/players/slice';
import { formatName, getNameParts } from 'state/players/utils';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';

const NEW_PLAYER_ID = 'new-player';

interface Props {
  teamRole: TeamRole;
  editable: boolean;
}

const Lineup = ({ teamRole, editable }: Props) => {
  const dispatch = useAppDispatch();

  const players = useAppSelector(state => getLineupToEdit(state, teamRole));
  const availablePlayers = useAppSelector(getPlayersNotInGame);
  const groupId = useAppSelector(getCurrentGroup)!;
  const teamName = useAppSelector(state => getTeamName(state, teamRole));

  const [searchValue, setSearchValue] = useState('');

  const online = useNetworkStatus();

  const [createPlayer] = useCreatePlayerMutation();

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
            const { data } = await createPlayer({ variables: { ...nameParts, groupId } });
            const player = data?.createPlayer?.player;
            if (player) {
              dispatch(playerActions.loadPlayer(player));
              playerId = player.id;
            }
          } else {
            const { payload } = dispatch(
              playerActions.createPlayerOffline({ ...nameParts, groupId })
            );
            playerId = payload.id;
          }
        }
        dispatch(gameActions.addPlayerToGame({ teamRole, playerId }));
        setSearchValue('');
      }
    },
    [groupId, online, teamRole, dispatch, searchValue, setSearchValue, createPlayer]
  );

  return (
    <Box flex>
      <Box alignSelf="center" margin={{ bottom: 'medium' }} width="medium">
        <TextInput
          value={teamName!}
          onChange={handleNameChange}
          placeholder={teamRole === TeamRole.AWAY ? 'Away Team' : 'Home Team'}
        />
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
