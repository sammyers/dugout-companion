import React from 'react';
import { Box, Button, Text } from 'grommet';
import { useNavigate } from 'react-router-dom';

const LeadersWidget = () => {
  const navigate = useNavigate();

  return (
    <Box gridArea="leaderboard" round="small" background="neutral-5" pad="small">
      <Text>Leaderboards</Text>
      <Button
        alignSelf="center"
        plain={false}
        color="accent-2"
        onClick={() => navigate('/leaders')}
      >
        All Leaders
      </Button>
    </Box>
  );
};

export default LeadersWidget;
