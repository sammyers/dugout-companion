import React, { useCallback, useState } from 'react';
import { Button, Spinner } from 'grommet';
import { StatusGood } from 'grommet-icons';
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
    <Button
      color="accent-2"
      plain={false}
      primary={success}
      disabled={success}
      icon={success ? <StatusGood /> : loading ? <Spinner /> : undefined}
      label="Dump Redux Store"
      onClick={handleClick}
    />
  );
};

export default DumpReduxStoreButton;
