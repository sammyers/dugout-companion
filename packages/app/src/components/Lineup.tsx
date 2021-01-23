import React, { useState, useMemo, useCallback, ChangeEvent } from 'react';
import { Box, Text, TextInput, TextInputProps, Heading } from 'grommet';
import _ from 'lodash';
import { Droppable } from 'react-beautiful-dnd';

import { TeamRole } from '@sammyers/dc-shared';

import LineupPlayer from './LineupPlayer';

import { getLineup, getPlayersNotInGame } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { playerActions } from 'state/players/slice';
import { getNameParts } from 'state/players/utils';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

const NEW_PLAYER_ID = 'new-player';

interface Props {
  teamRole: TeamRole;
  editable: boolean;
}

const Lineup = ({ teamRole, editable }: Props) => {
  const dispatch = useAppDispatch();

  const players = useAppSelector(state => getLineup(state, teamRole));
  const availablePlayers = useAppSelector(getPlayersNotInGame);

  const [searchValue, setSearchValue] = useState('');

  const suggestions = useMemo(() => {
    if (!searchValue.length) return [];

    const existingSuggestions = availablePlayers
      .filter(({ firstName }) => firstName.toLowerCase().startsWith(searchValue.toLowerCase()))
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

  const handleSearchChange = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) => setSearchValue(currentTarget.value),
    [setSearchValue]
  );

  const handleSuggestionSelect: NonNullable<TextInputProps['onSelect']> = useCallback(
    ({ suggestion }) => {
      if (suggestion) {
        let playerId = suggestion.value;
        if (playerId === NEW_PLAYER_ID) {
          const { payload } = dispatch(playerActions.addPlayer(getNameParts(searchValue)));
          playerId = payload.id;
        }
        dispatch(gameActions.addPlayerToGame({ teamRole, playerId }));
        setSearchValue('');
      }
    },
    [teamRole, dispatch, searchValue, setSearchValue]
  );

  return (
    <Box flex>
      <Heading level={4} textAlign="center" margin={{ top: 'none' }}>
        {teamRole === TeamRole.AWAY ? 'Away Team' : 'Home Team'}
      </Heading>
      <TextInput
        disabled={players.length === 10}
        placeholder="Add Player"
        suggestions={suggestions}
        value={searchValue}
        onChange={handleSearchChange}
        onSelect={handleSuggestionSelect}
      />
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
