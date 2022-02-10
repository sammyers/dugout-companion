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

export const useGroupContext = () => useContext(groupContext);
export const useAllGroups = () => useGroupContext().groups;
export const useCurrentGroupId = () => useGroupContext().currentGroup?.id;
export const useCurrentGroupName = () => useGroupContext().currentGroup?.name;
