import { GetPlayerProfileQuery, SimplifyType } from '@sammyers/dc-shared';

export type PlayerProfile = NonNullable<SimplifyType<GetPlayerProfileQuery>['player']>;
export type CareerRow = PlayerProfile['careerBattingStats'][number];
export type SeasonRow = PlayerProfile['seasonBattingStats'][number];
export type GameRow = PlayerProfile['gameBattingStats'][number];
export type StatsRow = CareerRow & SeasonRow & GameRow;
