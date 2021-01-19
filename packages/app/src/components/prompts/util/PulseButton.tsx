import React, { FC } from 'react';
import { Box, BoxProps, Button, Stack, Text } from 'grommet';

interface Props {
  label: string;
  color: BoxProps['background'];
  onClick: () => void;
}

const PulseButton: FC<Props> = ({ label, color, onClick }) => (
  <Stack>
    <Box height="xsmall" width="xsmall" background={color} round="50%" animation="pulse" />
    <Button onClick={onClick} fill>
      <Box justify="center" align="center" round="50%" background={color}>
        <Text weight="bold" textAlign="center">
          {label}
        </Text>
      </Box>
    </Button>
  </Stack>
);

export default PulseButton;
