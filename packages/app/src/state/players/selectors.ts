import { createSelector } from '@reduxjs/toolkit';

import { formatShortName } from './utils';

import { AppState } from 'state/store';
import { Player } from './types';

const getPlayer = (state: AppState, playerId: string): Player | undefined =>
  state.players[playerId];

export const getPlayerName = (state: AppState, playerId: string) => {
  const player = getPlayer(state, playerId);
  return player ? `${player.firstName} ${player.lastName}` : '';
};

export const getShortPlayerName = (state: AppState, playerId: string) => {
  const player = getPlayer(state, playerId);
  return player ? formatShortName(player) : '';
};

export const getAllPlayers = (state: AppState) => state.players;
export const getAllPlayersList = createSelector(getAllPlayers, players => Object.values(players));

export const getPlayerOptionsForSelector = (state: AppState, playerIds: string[]) =>
  playerIds.map(id => ({ label: getShortPlayerName(state, id), value: id }));

export const getPlayerGetter = createSelector(getAllPlayers, players => (playerId: string) =>
  players[playerId]
);
