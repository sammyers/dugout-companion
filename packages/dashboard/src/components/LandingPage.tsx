import React, { useState } from 'react';
import { Box, Button, Heading, Image, Text } from 'grommet';
import { useNavigate } from 'react-router-dom';

import { useAllGroups } from './context';
import { LoginModal, LogOutButton, useCurrentUser } from '@sammyers/dc-shared';
import { Login } from 'grommet-icons';

const LandingPage = () => {
  const navigate = useNavigate();

  const { currentUser } = useCurrentUser();

  const groups = useAllGroups();

  const [loginVisible, setLoginVisible] = useState(false);

  return (
    <Box fill align="center" pad="medium" justify="around">
      <LoginModal visible={loginVisible} onClose={() => setLoginVisible(false)} />
      <Box background="brand" round width="xsmall" margin="medium">
        <Image src="logo-transparent.png" />
      </Box>
      <Heading level={2} textAlign="center">
        Welcome to Dugout Companion!
      </Heading>
      <Box gap="medium" margin={{ bottom: 'medium' }}>
        <Text>Choose a group to continue:</Text>
        <Box gap="small">
          {groups.map(group => (
            <Button key={group.name} plain={false} onClick={() => navigate(`/g/${group.urlSlug}`)}>
              {group.name}
            </Button>
          ))}
        </Box>
      </Box>
      {currentUser ? (
        <Box align="center">
          <Heading level={5} color="neutral-1" margin="small">
            Logged in as {currentUser.fullName}
          </Heading>
          <LogOutButton alignSelf="center" />
        </Box>
      ) : (
        <Box gap="medium">
          <Text>Or log into your account:</Text>
          <Button
            alignSelf="center"
            label="Log in"
            icon={<Login />}
            onClick={() => setLoginVisible(true)}
          />
        </Box>
      )}
    </Box>
  );
};

export default LandingPage;
