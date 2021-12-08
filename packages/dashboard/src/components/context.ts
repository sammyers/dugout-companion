import { createContext, useContext } from 'react';

import { GetAllGroupsQuery, SimplifyType } from '@sammyers/dc-shared';

export type Group = SimplifyType<NonNullable<GetAllGroupsQuery['groups']>[number]>;

interface GroupContext {
  groups: Group[];
  currentGroup?: Group;
  setCurrentGroup: (groupId: string) => void;
}

export const groupContext = createContext<GroupContext>({
  groups: [],
  setCurrentGroup: () => {},
});

export const useCurrentGroupId = () => useContext(groupContext).currentGroup?.id;
export const useCurrentGroupName = () => useContext(groupContext).currentGroup?.name;
