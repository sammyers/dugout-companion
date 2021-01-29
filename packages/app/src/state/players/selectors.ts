import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { formatShortName } from './utils';

import { AppState } from 'state/store';
import { Player } from './types';

export const getUnsyncedPlayers = (state: AppState) => state.players.unsynced;
export const anyUnsyncedPlayers = createSelector(getUnsyncedPlayers, players => !!_.size(players));

const getMergedPlayers = (state: AppState) => {
  const { synced, unsynced } = state.players;
  return { ...synced, ...unsynced };
};

const getPlayer = (state: AppState, playerId: string): Player | undefined =>
  getMergedPlayers(state)[playerId];

export const getPlayerName = (state: AppState, playerId: string) => {
  const player = getPlayer(state, playerId);
  if (player && player.lastName) {
    return `${player.firstName} ${player.lastName}`;
  }
  return player?.firstName ?? '';
};

export const getShortPlayerName = (state: AppState, playerId: string) => {
  const player = getPlayer(state, playerId);
  return player ? formatShortName(player) : '';
};

export const getAllPlayersList = createSelector(getMergedPlayers, players =>
  Object.values(players)
);

export const getPlayerOptionsForSelector = (state: AppState, playerIds: string[]) =>
  playerIds.map(id => ({ label: getShortPlayerName(state, id), value: id }));

export const getPlayerGetter = createSelector(getMergedPlayers, players => (playerId: string) =>
  players[playerId]
);
