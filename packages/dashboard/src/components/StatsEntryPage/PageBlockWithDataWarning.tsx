import React, { FC } from 'react';
import { Box, Notification, Stack } from 'grommet';

import PageBlock from '../util/PageBlock';
import { Alert } from 'grommet-icons';

interface Props {
  warning?: string;
}

const PageBlockWithDataWarning: FC<Props> = ({ warning, children }) => {
  return (
    <Stack anchor="top-right">
      <PageBlock
        overflow={{ horizontal: 'auto' }}
        gap="small"
        border={warning ? { color: 'status-critical', size: 'medium' } : undefined}
      >
        {children}
      </PageBlock>
      {!!warning && (
        <Box
          margin={{ top: 'small', right: 'small', left: 'small' }}
          background="status-critical"
          round="xsmall"
          style={{ transform: 'translateY(-100%)' }}
        >
          <Notification
            status="warning"
            icon={<Alert />}
            title="Mismatched Data"
            message={warning}
          />
        </Box>
      )}
    </Stack>
  );
};

export default PageBlockWithDataWarning;
