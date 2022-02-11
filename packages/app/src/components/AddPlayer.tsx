import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';
import _ from 'lodash';
import { Box, Text, TextInput, TextInputProps } from 'grommet';

import { useAddPlayerToGroupMutation, useCreatePlayerMutation } from '@sammyers/dc-shared';

import { getPlayersNotInGame } from 'state/game/selectors';
import { getCurrentGroupId } from 'state/groups/selectors';
import { playerActions } from 'state/players/slice';
import { formatName, getNameParts } from 'state/players/utils';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';

const NEW_PLAYER_ID = 'new-player';

interface Props {
  placeholder?: string;
  onSelect: (playerId: string) => void;
}

const AddPlayer: FC<Props> = ({ onSelect, placeholder = 'Add Player' }) => {
  const online = useNetworkStatus();
  const dispatch = useAppDispatch();

  const availablePlayers = useAppSelector(getPlayersNotInGame);
  const groupId = useAppSelector(getCurrentGroupId)!;

  const [searchValue, setSearchValue] = useState('');

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
              dispatch(playerActions.loadPlayer(player));
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
        onSelect(playerId);
        setSearchValue('');
      }
    },
    [
      groupId,
      online,
      availablePlayers,
      dispatch,
      searchValue,
      setSearchValue,
      createPlayer,
      addPlayerToGroup,
      onSelect,
    ]
  );

  return (
    <TextInput
      placeholder={placeholder}
      suggestions={suggestions}
      value={searchValue}
      onChange={handleSearchChange}
      onSelect={handleSuggestionSelect}
    />
  );
};

export default AddPlayer;
