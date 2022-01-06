import { Maybe } from '@sammyers/dc-shared';

interface PlayerRecord {
  player: Maybe<{
    fullName: Maybe<string>;
  }>;
  legacyPlayer: Maybe<{
    playerName: Maybe<string>;
  }>;
}
export const extractPlayerName = ({ player, legacyPlayer }: PlayerRecord) => {
  if (player) {
    return player.fullName!;
  }
  if (legacyPlayer!.playerName!.startsWith('Z-')) {
    return legacyPlayer!.playerName!.substring(2);
  }
  return legacyPlayer!.playerName!;
};
