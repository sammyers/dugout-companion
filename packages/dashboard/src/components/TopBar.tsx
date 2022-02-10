import React, { useCallback } from 'react';
import { Avatar, Box, Button, DropButton, Heading, Select, Text } from 'grommet';
import { Home, User } from 'grommet-icons';
import { Outlet, useMatch, useNavigate, useParams } from 'react-router-dom';

import { useAllGroups } from './context';

const GroupSelector = () => {
  const { groupSlug } = useParams();
  const navigate = useNavigate();

  const groups = useAllGroups();

  const setGroup = useCallback(
    (newGroupSlug: string) => {
      navigate(`/g/${newGroupSlug}`);
    },
    [navigate]
  );

  return (
    <Select
      options={groups}
      labelKey="name"
      valueKey={{ key: 'urlSlug', reduce: true }}
      value={groupSlug}
      onChange={({ value }) => setGroup(value)}
    />
  );
};

const TopBar = () => {
  const navigate = useNavigate();
  const match = useMatch({ path: '/g/:groupSlug', end: true });

  return (
    <Box direction="row" justify="between" align="center" pad="small">
      {!match && <Button icon={<Home />} onClick={() => navigate('')} />}
      <Heading level={3} margin={{ horizontal: 'small', vertical: 'none' }}>
        <Outlet />
      </Heading>
      <DropButton
        dropAlign={{ top: 'bottom', right: 'right' }}
        dropProps={{ margin: { top: 'xsmall' } }}
        dropContent={
          <Box pad="small" background="light-2" border={{ color: 'light-4' }}>
            <Text textAlign="center">Current Group</Text>
            <GroupSelector />
          </Box>
        }
      >
        <Avatar size="medium" border={{ color: 'neutral-5' }}>
          <User size="medium" />
        </Avatar>
      </DropButton>
    </Box>
  );
};

export default TopBar;
