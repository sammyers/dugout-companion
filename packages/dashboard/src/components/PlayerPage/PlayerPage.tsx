import React, { useState } from 'react';
import { format, parse } from 'date-fns';
import { Box, Button, Heading, Text } from 'grommet';
import { Navigate, useParams } from 'react-router-dom';

import { groupIdOptions, useCurrentUser, useGetPlayerProfileQuery } from '@sammyers/dc-shared';

import PageBlock from '../util/PageBlock';
import PlayerSeasonStats from './PlayerSeasonStats';

import { useCurrentGroupId } from '../context';
import ClaimAccountModal from './ClaimAccountModal';
import _ from 'lodash';

const formatDate = (dateStr: string) => {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(date, 'MMMM do, yyyy');
};

const PlayerPage = () => {
  const { id } = useParams();

  const groupId = useCurrentGroupId();
  const { currentUser } = useCurrentUser();
  const { data } = useGetPlayerProfileQuery(groupIdOptions(groupId, { playerId: id! }));

  const [claimModalVisible, setClaimModalVisible] = useState(false);

  if (!data) {
    return null;
  }

  if (!data.player?.groups.some(group => group.groupId === groupId)) {
    return <Navigate to=".." />;
  }

  return (
    <Box>
      <ClaimAccountModal
        visible={claimModalVisible}
        onClose={() => setClaimModalVisible(false)}
        player={_.pick(data.player, ['id', 'fullName'])}
      />
      <PageBlock pad="small" direction="row" justify="between" wrap>
        <Text margin="small" size="16px">
          Name:{' '}
          <Text weight="bold" size="inherit">
            {data.player?.fullName}
          </Text>
        </Text>
        <Text margin="small" size="16px">
          Debut:{' '}
          <Text weight="bold" size="inherit">
            {formatDate(data.player!.debut!)}
          </Text>
        </Text>
        {!currentUser && !data.player.claimed && (
          <Button
            label="Claim Account"
            alignSelf="center"
            onClick={() => setClaimModalVisible(true)}
          />
        )}
      </PageBlock>
      <Heading level={4} margin={{ horizontal: 'medium', top: 'small', bottom: 'xsmall' }}>
        Seasons
      </Heading>
      <PlayerSeasonStats {...data.player!} />
    </Box>
  );
};

export const PlayerPageTitle = () => {
  return <>Player Profile</>;
};

export default PlayerPage;
