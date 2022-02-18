import React, { useCallback, useState } from 'react';
import { Box, Button, DropButton, Spinner } from 'grommet';
import { Bug, StatusGood } from 'grommet-icons';
import { useStore } from 'react-redux';

import { useDumpReduxStoreMutation } from '@sammyers/dc-shared';

import { AppState } from 'state/store';

const DumpReduxStoreButton = () => {
  const store = useStore<AppState>();

  const [success, setSuccess] = useState(false);

  const [saveReduxDump, { loading }] = useDumpReduxStoreMutation({
    onCompleted: () => setSuccess(true),
  });

  const handleClick = useCallback(() => {
    const state = store.getState();
    saveReduxDump({ variables: { storeJson: JSON.stringify(state) } });
  }, [store, saveReduxDump]);

  return (
    <Box style={{ position: 'absolute', bottom: 0, right: 0 }} margin="small">
      <DropButton
        icon={<Bug />}
        plain={false}
        color="accent-2"
        dropContent={
          <Box pad="small" background="white">
            <Button
              color="accent-2"
              plain={false}
              primary={success}
              disabled={success}
              icon={success ? <StatusGood /> : loading ? <Spinner /> : undefined}
              label="Dump Redux Store (for debug only)"
              onClick={handleClick}
            />
          </Box>
        }
        dropProps={{ align: { bottom: 'top' } }}
      />
    </Box>
  );
};

export default DumpReduxStoreButton;
