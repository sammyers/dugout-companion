import React, { FC, useMemo } from 'react';
import { Box, Button, Text } from 'grommet';
import { Blank } from 'grommet-icons';

import { canStealBases, canRunnerStealBase, getRunnerMap } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getShortPlayerName } from 'state/players/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { ReactComponent as BaseSvg } from 'graphics/base.svg';

import { BaseType } from '@sammyers/dc-shared';

const BaseIcon = ({ occupied }: { occupied?: boolean }) => (
  <Blank
    size="large"
    color={occupied ? 'accent-4' : undefined}
    fillOpacity={occupied ? 1 : undefined}
  >
    <BaseSvg />
  </Blank>
);

interface OccupiedBaseProps {
  base: BaseType;
  runnerId: string;
}

const OccupiedBase: FC<OccupiedBaseProps> = ({ base, runnerId }) => {
  const dispatch = useAppDispatch();

  const name = useAppSelector(state => getShortPlayerName(state, runnerId));
  const stealsAllowed = useAppSelector(canStealBases);
  const stealAvailable = useAppSelector(state => canRunnerStealBase(state, runnerId));

  const stealButton = useMemo(
    () => (
      <Button
        style={{ width: '108px', visibility: stealAvailable ? 'visible' : 'hidden' }}
        plain={false}
        label="Steal"
        color="status-ok"
        onClick={() => dispatch(gameActions.recordStolenBase({ runnerId, success: true }))}
      />
    ),
    [dispatch, runnerId, stealAvailable]
  );
  const caughtButton = useMemo(
    () => (
      <Button
        style={{ width: '108px' }}
        plain={false}
        label="Caught"
        color="status-error"
        onClick={() => dispatch(gameActions.recordStolenBase({ runnerId, success: false }))}
      />
    ),
    [dispatch, runnerId]
  );

  if (base === BaseType.SECOND) {
    return (
      <Box align="center" gap="small">
        {stealsAllowed ? (
          <Box direction="row" align="center" gap="small">
            {stealButton}
            <BaseIcon occupied />
            {caughtButton}
          </Box>
        ) : (
          <BaseIcon occupied />
        )}
        <Text weight="bold" textAlign="center">
          {name}
        </Text>
      </Box>
    );
  }

  return (
    <Box gap="small" align={base === BaseType.FIRST ? 'end' : 'start'}>
      {stealsAllowed && stealButton}
      <Box
        direction={base === BaseType.FIRST ? 'row' : 'row-reverse'}
        justify="end"
        align="center"
        gap="small"
      >
        <Text weight="bold" textAlign="center">
          {name}
        </Text>
        <BaseIcon occupied />
      </Box>
      {stealsAllowed && caughtButton}
    </Box>
  );
};

interface Props {
  base: BaseType;
}

const Base: FC<Props> = ({ base }) => {
  const { [base]: runnerId } = useAppSelector(getRunnerMap);

  if (runnerId) {
    return (
      <Box margin="xsmall">
        <OccupiedBase base={base} runnerId={runnerId} />
      </Box>
    );
  }

  return (
    <Box margin="xsmall">
      <BaseIcon />
    </Box>
  );
};

export default Base;
