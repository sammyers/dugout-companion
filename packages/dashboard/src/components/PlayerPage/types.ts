import { GetPlayerProfileQuery, SimplifyType } from '@sammyers/dc-shared';

export type PlayerProfile = NonNullable<SimplifyType<GetPlayerProfileQuery>['player']>;
export type SeasonRow = PlayerProfile['seasonStats'][number];
export type GameRow = PlayerProfile['gameBattingLines'][number];
export type LegacyGameRow = PlayerProfile['legacyGameBattingLines'][number];
