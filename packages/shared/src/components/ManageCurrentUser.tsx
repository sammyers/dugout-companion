import React, { useState } from 'react';
import { Box, Button, Heading } from 'grommet';
import { Login } from 'grommet-icons';

import LoginModal from './LoginModal';
import LogOutButton from './LogOutButton';

import { useCurrentUser } from '../hooks';

const ManageCurrentUser = () => {
  const { currentUser } = useCurrentUser();
  const [showLogin, setShowLogin] = useState(false);

  if (currentUser) {
    return (
      <Box align="center" margin={{ bottom: 'medium' }}>
        <Heading level={5} color="neutral-1" margin="small">
          Logged in as {currentUser.fullName}
        </Heading>
        <LogOutButton alignSelf="center" />
      </Box>
    );
  }

  return (
    <Box align="center" margin={{ bottom: 'medium' }}>
      <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
      <Heading level={5} color="status-critical" margin="small">
        Not logged in
      </Heading>
      <Button icon={<Login />} label="Log In" onClick={() => setShowLogin(true)} />
    </Box>
  );
};

export default ManageCurrentUser;
