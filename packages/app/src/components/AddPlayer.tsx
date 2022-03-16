import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';
import _ from 'lodash';
import { Box, Text, TextInput, TextInputProps } from 'grommet';

import {
  GroupPermissionType,
  PermissionType,
  useAddPlayerToGroupMutation,
  useCreatePlayerMutation,
  usePermission,
} from '@sammyers/dc-shared';

import { getPlayersNotInGame } from 'state/game/selectors';
import { getCurrentGroupId } from 'state/groups/selectors';
import { getAllPlayersList } from 'state/players/selectors';
import { playerActions } from 'state/players/slice';
import { formatName, getNameParts } from 'state/players/utils';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';
import { Player } from 'state/players/types';

const NEW_PLAYER_ID = 'new-player';

interface Props {
  placeholder?: string;
  onSelect: (playerId: string) => void;
}

const AddPlayer: FC<Props> = ({ onSelect, placeholder = 'Add Player' }) => {
  const online = useNetworkStatus();
  const dispatch = useAppDispatch();

  const allPlayers = useAppSelector(getAllPlayersList);
  const availablePlayers = useAppSelector(getPlayersNotInGame);
  const groupId = useAppSelector(getCurrentGroupId)!;

  const [searchValue, setSearchValue] = useState('');

  const [createPlayer] = useCreatePlayerMutation();
  const [addPlayerToGroup] = useAddPlayerToGroupMutation();

  const canAddPlayersToGroup = usePermission(GroupPermissionType.ADD_PLAYERS_TO_GROUP, groupId);
  const canCreatePlayers = usePermission(PermissionType.ADD_NEW_PLAYERS);

  const suggestions = useMemo(() => {
    if (!searchValue.length) return [];

    const playerInGroup = (player: Player) =>
      _.some(player.groups, group => group.groupId === groupId);

    const existingSuggestions = _.orderBy(
      availablePlayers
        .filter(player => canAddPlayersToGroup || playerInGroup(player))
        .filter(player => formatName(player).toLowerCase().startsWith(searchValue.toLowerCase())),
      playerInGroup,
      ['desc']
    ).map(player => {
      const name = formatName(player);
      const inGroup = playerInGroup(player);

      return {
        value: player.id,
        label: (
          <Box pad="small" border={!inGroup ? { color: 'status-warning', size: '1px' } : undefined}>
            <Text>
              {name}
              {inGroup ? '' : ` (not in group)`}
            </Text>
          </Box>
        ),
      };
    });

    const playerNameTaken = _.some(
      allPlayers,
      player => formatName(player).toLowerCase() === searchValue.trim().toLowerCase()
    );

    if (searchValue.length > 2 && !playerNameTaken && canCreatePlayers) {
      return existingSuggestions.concat({
        label: (
          <Box pad="small" border={{ color: 'status-ok', size: '2px' }}>
            <Text>Add new player "{searchValue}"</Text>
          </Box>
        ),
        value: NEW_PLAYER_ID,
      });
    }
    return existingSuggestions;
  }, [availablePlayers, allPlayers, searchValue, canAddPlayersToGroup, canCreatePlayers, groupId]);

  const handleSearchChange = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) => setSearchValue(currentTarget.value),
    [setSearchValue]
  );

  const handleSuggestionSelect: NonNullable<TextInputProps['onSelect']> = useCallback(
    async ({ suggestion }) => {
      if (suggestion) {
        let playerId = suggestion.value;
        if (playerId === NEW_PLAYER_ID) {
          const nameParts = getNameParts(searchValue.trim());
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
