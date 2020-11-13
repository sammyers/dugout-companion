import React, { useState, useMemo, useCallback, ChangeEvent } from 'react';
import { Box, Text, TextInput, TextInputProps, Heading } from 'grommet';
import _ from 'lodash';
import { DragDropContext, Droppable, DragDropContextProps } from 'react-beautiful-dnd';

import LineupPlayer from './LineupPlayer';

import { getLineup, getPlayersNotInGame } from 'state/game/selectors';
import { addPlayerToGame, movePlayer } from 'state/game/slice';
import { TeamRole } from 'state/game/types';
import { formatShortName } from 'state/players/utils';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

const Lineup = ({ team }: { team: TeamRole }) => {
  const dispatch = useAppDispatch();

  const players = useAppSelector(state => getLineup(state, team));
  const availablePlayers = useAppSelector(getPlayersNotInGame);

  const [searchValue, setSearchValue] = useState('');

  const suggestions = useMemo(() => {
    if (!searchValue.length) return [];

    return availablePlayers
      .filter(({ firstName }) => firstName.toLowerCase().startsWith(searchValue.toLowerCase()))
      .map(player => ({ value: player.playerId, label: formatShortName(player) }));
  }, [availablePlayers, searchValue]);

  const handleSearchChange = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) => setSearchValue(currentTarget.value),
    [setSearchValue]
  );

  const handleSuggestionSelect: NonNullable<TextInputProps['onSelect']> = useCallback(
    ({ suggestion }) => {
      dispatch(addPlayerToGame({ team, playerId: suggestion.value }));
      setSearchValue('');
    },
    [team, dispatch, setSearchValue]
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
          {_.range(1, 11).map(lineupSpot => (
            <Box height="xxsmall" justify="center">
              <Text>{lineupSpot}</Text>
            </Box>
          ))}
        </Box>
        <Droppable droppableId={team === TeamRole.AWAY ? 'AWAY' : 'HOME'}>
          {({ innerRef, droppableProps, placeholder }) => (
            <Box ref={innerRef} {...droppableProps} flex>
              {players.map((playerId, index) => (
                <LineupPlayer key={playerId} playerId={playerId} index={index} />
              ))}
              {placeholder}
            </Box>
          )}
        </Droppable>
      </Box>
    </Box>
  );
};

const Teams = () => {
  const dispatch = useAppDispatch();

  const handleDragEnd: DragDropContextProps['onDragEnd'] = useCallback(
    ({ source, destination }) => {
      if (!destination) return;
      dispatch(
        movePlayer({
          fromTeam: TeamRole[source.droppableId as keyof typeof TeamRole],
          toTeam: TeamRole[destination.droppableId as keyof typeof TeamRole],
          startIndex: source.index,
          endIndex: destination.index,
        })
      );
    },
    [dispatch]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box direction="row" justify="around" pad="medium" gap="medium">
        <Lineup team={TeamRole.AWAY} />
        <Lineup team={TeamRole.HOME} />
      </Box>
    </DragDropContext>
  );
};

export default Teams;
