import { AppState } from 'state/store';

export const getPlayerName = (state: AppState, playerId: string) => {
  const player = state.players[playerId];
  return player ? `${player.firstName} ${player.lastName}` : '';
};

export const getShortPlayerName = (state: AppState, playerId: string) => {
  const player = state.players[playerId];
  return player ? `${player.firstName} ${player.lastName[0]}` : '';
};
