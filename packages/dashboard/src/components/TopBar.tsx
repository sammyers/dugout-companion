import React, { useContext } from 'react';
import { Avatar, Box, Button, DropButton, Heading, Select, Text } from 'grommet';
import { Home, User } from 'grommet-icons';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { groupContext } from './context';

const GroupSelector = () => {
  const { currentGroup, groups, setCurrentGroup } = useContext(groupContext);

  return (
    <Select
      options={groups}
      labelKey="name"
      valueKey={{ key: 'id', reduce: true }}
      value={currentGroup?.id}
      onChange={({ value }) => setCurrentGroup(value)}
    />
  );
};

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box direction="row" justify="between" align="center" pad="small">
      {location.pathname !== '/' && <Button icon={<Home />} onClick={() => navigate('/')} />}
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
