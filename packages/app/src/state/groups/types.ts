import { GetAllGroupsQuery, SimplifyType } from '@sammyers/dc-shared';

export type Group = SimplifyType<NonNullable<GetAllGroupsQuery['groups']>[number]>;
