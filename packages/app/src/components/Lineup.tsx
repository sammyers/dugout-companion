import React, { useState, useMemo, useCallback, ChangeEvent } from 'react';
import { Box, Text, TextInput, TextInputProps, Heading } from 'grommet';
import _ from 'lodash';
import { Droppable } from 'react-beautiful-dnd';

import LineupPlayer from './LineupPlayer';

import { getLineup, getPlayersNotInGame } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { TeamRole } from 'state/game/types';
import { getNameParts } from 'state/players/utils';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { addPlayer } from 'state/players/slice';

const NEW_PLAYER_ID = 'new-player';

const Lineup = ({ team }: { team: TeamRole }) => {
  const dispatch = useAppDispatch();

  const players = useAppSelector(state => getLineup(state, team));
  const availablePlayers = useAppSelector(getPlayersNotInGame);

  const [searchValue, setSearchValue] = useState('');

  const suggestions = useMemo(() => {
    if (!searchValue.length) return [];

    const existingSuggestions = availablePlayers
      .filter(({ firstName }) => firstName.toLowerCase().startsWith(searchValue.toLowerCase()))
      .map(player => ({
        value: player.playerId,
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
          const { payload } = dispatch(addPlayer(getNameParts(searchValue)));
          playerId = payload.playerId;
        }
        dispatch(gameActions.addPlayerToGame({ team, playerId }));
        setSearchValue('');
      }
    },
    [team, dispatch, searchValue, setSearchValue]
  );

  return (
    <Box flex>
      <Heading level={4} textAlign="center" margin={{ top: 'none' }}>
        {team === TeamRole.AWAY ? 'Away Team' : 'Home Team'}
      </Heading>
      <TextInput
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
        <Droppable droppableId={team === TeamRole.AWAY ? 'AWAY' : 'HOME'}>
          {({ innerRef, droppableProps, placeholder }) => (
            <Box ref={innerRef} {...droppableProps} flex>
              {players.map((playerId, index) => (
                <LineupPlayer key={playerId} playerId={playerId} index={index} team={team} />
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
