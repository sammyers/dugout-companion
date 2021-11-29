import React, { ReactNode, useCallback } from 'react';
import { Box, Button } from 'grommet';

import PulseButton from './util/PulseButton';

import {
  canMoveToNextStage,
  canSelectNextRunner,
  canSelectPreviousRunner,
  getCanSubmit,
  getCurrentPromptStage,
} from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { PromptUiStage } from 'state/prompts/types';

const PrimaryPromptNav = () => {
  const dispatch = useAppDispatch();

  const currentStage = useAppSelector(getCurrentPromptStage);
  const nextStageAvailable = useAppSelector(canMoveToNextStage);
  const canSubmit = useAppSelector(getCanSubmit);

  const showNextRunner = useAppSelector(canSelectNextRunner);
  const showPreviousRunner = useAppSelector(canSelectPreviousRunner);

  const handleClickNextRunner = useCallback(() => {
    dispatch(promptActions.selectNextRunner());
  }, [dispatch]);

  const handleClickPreviousRunner = useCallback(() => {
    dispatch(promptActions.selectPreviousRunner());
  }, [dispatch]);

  const handleClickNextStage = useCallback(() => {
    dispatch(promptActions.goToNextStage());
  }, [dispatch]);

  const handleSubmit = useCallback(() => {
    dispatch(promptActions.submitPlateAppearance());
  }, [dispatch]);

  let primary: ReactNode = null;
  let secondary: ReactNode = null;
  if (
    !nextStageAvailable &&
    canSubmit &&
    (currentStage !== PromptUiStage.RUNNERS || !showNextRunner)
  ) {
    primary = <PulseButton label="Submit" color="status-ok" onClick={handleSubmit} />;
  } else if (currentStage === PromptUiStage.RUNNERS && showNextRunner) {
    primary = <PulseButton label="Next Runner" color="neutral-3" onClick={handleClickNextRunner} />;
  } else if (nextStageAvailable) {
    primary = <PulseButton label="Next" color="neutral-3" onClick={handleClickNextStage} />;
  }
  if (currentStage === PromptUiStage.RUNNERS && showPreviousRunner) {
    secondary = (
      <Button
        color="neutral-3"
        size="small"
        label="Previous Runner"
        onClick={handleClickPreviousRunner}
      />
    );
  }

  return (
    <Box
      style={{ position: 'absolute', bottom: 0, right: 0 }}
      direction="row"
      align="center"
      gap="small"
      pad="medium"
    >
      {secondary && <Box width="xsmall">{secondary}</Box>}
      {primary}
    </Box>
  );
};

export default PrimaryPromptNav;
