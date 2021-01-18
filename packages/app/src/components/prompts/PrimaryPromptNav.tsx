import React, { ReactNode, useCallback } from 'react';
import { Box } from 'grommet';

import RunnerNavigation from './runners/RunnerNavigation';
import PulseButton from './PulseButton';

import { canMoveToNextStage, getCurrentPromptStage } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { PromptUiStage } from 'state/prompts/types';

const PrimaryPromptNav = () => {
  const dispatch = useAppDispatch();

  const currentStage = useAppSelector(getCurrentPromptStage);
  const nextStageAvailable = useAppSelector(canMoveToNextStage);

  const handleClickNext = useCallback(() => {
    dispatch(promptActions.goToNextStage());
  }, [dispatch]);

  const handleSubmit = useCallback(() => {
    dispatch(promptActions.submitPlateAppearance());
  }, [dispatch]);

  let nav: ReactNode;
  if (currentStage === PromptUiStage.RUNNERS) {
    nav = <RunnerNavigation />;
  } else if (currentStage === PromptUiStage.SUMMARY) {
    nav = <PulseButton label="Submit" color="status-ok" onClick={handleSubmit} />;
  } else {
    if (nextStageAvailable) {
      nav = <PulseButton label="Next" color="neutral-3" onClick={handleClickNext} />;
    } else {
      nav = null;
    }
  }

  return (
    <Box style={{ position: 'absolute', bottom: 0, right: 0 }} pad="medium">
      {nav}
    </Box>
  );
};

export default PrimaryPromptNav;
