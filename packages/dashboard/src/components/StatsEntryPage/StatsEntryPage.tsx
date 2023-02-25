import React from 'react';
import { Box, Button } from 'grommet';
import { useNavigate, Navigate } from 'react-router-dom';

import { GroupPermissionType, usePermission } from '@sammyers/dc-shared';

import { useCurrentGroupId } from '../context';
import PageBlock from '../util/PageBlock';

const StatsEntryPage = () => {
  const groupId = useCurrentGroupId();
  const canEnterStats = usePermission(GroupPermissionType.SAVE_GAMES, groupId ?? '');

  if (!groupId || canEnterStats == null) {
    return null;
  }

  if (!canEnterStats) {
    return <Navigate to=".." replace />;
  }

  return <PageBlock></PageBlock>;
};

export const StatsEntryPageTitle = () => {
  return <>Enter Stats</>;
};

export const StatsEntryPageLink = () => {
  const groupId = useCurrentGroupId();
  const canEnterStats = usePermission(GroupPermissionType.SAVE_GAMES, groupId ?? '');

  const navigate = useNavigate();

  if (!canEnterStats) return null;

  return (
    <Button
      plain={false}
      color="neutral-1"
      alignSelf="center"
      margin={{ top: 'small' }}
      onClick={() => navigate('new-game')}
    >
      Enter Stats
    </Button>
  );
};

export default StatsEntryPage;
