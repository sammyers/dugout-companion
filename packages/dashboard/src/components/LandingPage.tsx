import React from 'react';
import { Box, Button, Heading, Text } from 'grommet';
import { useNavigate } from 'react-router-dom';

import { useAllGroups } from './context';

const LandingPage = () => {
  const navigate = useNavigate();

  const groups = useAllGroups();

  return (
    <Box fill align="center" pad="medium" justify="around">
      <Heading level={2} textAlign="center">
        Welcome to Dugout Companion!
      </Heading>
      <Box gap="medium">
        <Text>Choose a group to continue:</Text>
        <Box gap="small">
          {groups.map(group => (
            <Button plain={false} onClick={() => navigate(`/g/${group.urlSlug}`)}>
              {group.name}
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
