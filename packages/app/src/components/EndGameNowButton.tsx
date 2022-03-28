import React, { FC, useCallback, useState } from 'react';
import { Box, Button, Heading, Layer, Select, Text } from 'grommet';
import { StopFill } from 'grommet-icons';
import _ from 'lodash';

import { EarlyGameEndReason, HalfInning } from '@sammyers/dc-shared';

import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { getHalfInning } from 'state/game/selectors';

interface Props {
  opponentRunsScored?: number;
}

const EndGameNowButton: FC<Props> = ({ opponentRunsScored }) => {
  const dispatch = useAppDispatch();

  const halfInning = useAppSelector(getHalfInning);
  const mustBeDropDead = opponentRunsScored && halfInning === HalfInning.TOP;

  const [showEndGameNowModal, setShowEndGameNowModal] = useState(false);
  const [reason, setReason] = useState(EarlyGameEndReason.MERCY_RULE);

  const handleClose = useCallback(() => setShowEndGameNowModal(false), [setShowEndGameNowModal]);

  const handleEndGame = useCallback(() => {
    if (opponentRunsScored !== undefined) {
      dispatch(gameActions.recordSoloModeOpponentInning({ runsScored: opponentRunsScored }));
    }
    dispatch(
      gameActions.recordEarlyGameEnd(mustBeDropDead ? EarlyGameEndReason.MERCY_RULE : reason)
    );
  }, [dispatch, reason, opponentRunsScored, mustBeDropDead]);

  return (
    <>
      {showEndGameNowModal && (
        <Layer modal onClickOutside={handleClose} background="transparent">
          <Box pad="medium" background="light-2" round gap="small">
            <Heading level={3} margin={{ vertical: 'small' }}>
              End Game
            </Heading>
            <Text>Are you sure you want to end this game now?</Text>
            {!mustBeDropDead && (
              <Box gap="small">
                <Text margin={{ top: 'small' }}>Reason:</Text>
                <Select
                  value={reason}
                  options={_.values(EarlyGameEndReason).map(value => ({
                    label: _.startCase(_.lowerCase(value)),
                    value,
                  }))}
                  labelKey="label"
                  valueKey={{ key: 'value', reduce: true }}
                  onChange={option => setReason(option.value)}
                />
              </Box>
            )}
            <Box direction="row" gap="medium" margin={{ top: 'small' }}>
              <Button color="status-critical" plain={false} label="Cancel" onClick={handleClose} />
              <Button
                color="status-ok"
                primary
                plain={false}
                label="Confirm"
                onClick={handleEndGame}
              />
            </Box>
          </Box>
        </Layer>
      )}
      <Button
        size="small"
        primary
        color="status-critical"
        plain={false}
        icon={<StopFill />}
        label={mustBeDropDead ? 'End Game (Drop Dead)' : 'End Game Now'}
        onClick={() => setShowEndGameNowModal(true)}
      />
    </>
  );
};

export default EndGameNowButton;
