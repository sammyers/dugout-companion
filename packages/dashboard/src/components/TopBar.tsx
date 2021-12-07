import React from 'react';
import { Avatar, Box, Button, Heading } from 'grommet';
import { Home, User } from 'grommet-icons';
import { Outlet, useLocation, useNavigate } from 'react-router';

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box direction="row" justify="between" align="center" pad="small">
      {location.pathname !== '/' && <Button icon={<Home />} onClick={() => navigate('/')} />}
      <Heading level={3} margin={{ horizontal: 'small', vertical: 'none' }}>
        <Outlet />
      </Heading>
      <Avatar size="medium" border={{ color: 'neutral-5' }}>
        <User size="medium" />
      </Avatar>
    </Box>
  );
};

export default TopBar;
