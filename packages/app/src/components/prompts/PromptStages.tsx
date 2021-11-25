import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Button, Text } from 'grommet';
import { Previous } from 'grommet-icons';

import InteractableField from './panels/InteractiveFieldPanel/InteractiveFieldPanel';
import OutOnPlayPrompt from './panels/OutOnPlayPanel';
import SacFlyRbiPrompt from './panels/SacFlyRbiPanel';
import PromptStateManager from './PromptStateManager';
import PrimaryPromptNav from './PrimaryPromptNav';

import {
  canMoveToPreviousStage,
  getCurrentPromptStage,
  getPromptStages,
} from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { usePromptContext } from './context';

import { PromptUiStage } from 'state/prompts/types';

const AnimatedBox = motion(Box);

const PromptStages = () => {
  const dispatch = useAppDispatch();

  const { contactOptions, outOnPlayOptions } = usePromptContext();

  const currentStage = useAppSelector(getCurrentPromptStage);
  const allStages = useAppSelector(getPromptStages);
  const previousStageAvailable = useAppSelector(canMoveToPreviousStage);

  const handleClickPrevious = useCallback(() => {
    dispatch(promptActions.goToPreviousStage());
  }, [dispatch]);

  const stageHeading = useMemo(() => {
    switch (currentStage) {
      case PromptUiStage.CONTACT:
        if (contactOptions) {
          return 'Select contact details:';
        } else {
          return 'Select which fielder made the play:';
        }
      case PromptUiStage.RUNNERS:
        return 'Select final runner positions:';
      case PromptUiStage.OUTS_ON_PLAY:
        if (outOnPlayOptions?.multiple) {
          return 'Select which runners were out on the play:';
        }
        return 'Select which runner was out on the play:';
      case PromptUiStage.SAC_FLY_RBIS:
        return 'Select number of runs batted in:';
    }
  }, [currentStage, contactOptions, outOnPlayOptions]);

  const contactAndRunnersSeparate = [
    PromptUiStage.CONTACT,
    PromptUiStage.OUTS_ON_PLAY,
    PromptUiStage.RUNNERS,
  ].every(stage => allStages.includes(stage));

  const currentStagePanel = useMemo(() => {
    if (currentStage === PromptUiStage.SAC_FLY_RBIS) {
      return <SacFlyRbiPrompt />;
    } else if (currentStage === PromptUiStage.OUTS_ON_PLAY) {
      return <OutOnPlayPrompt />;
    } else if (currentStage) {
      return (
        <InteractableField mode={currentStage === PromptUiStage.CONTACT ? 'fielders' : 'runners'} />
      );
    }
  }, [currentStage]);

  if (currentStage === undefined) {
    return null;
  }

  return (
    <Box height="400px" width="large" style={{ position: 'relative' }}>
      <Box
        direction="row"
        justify="between"
        align="center"
        background="brand"
        pad="small"
        round="4px"
      >
        <Box flex align="start">
          {previousStageAvailable && (
            <Button plain icon={<Previous size="medium" />} onClick={handleClickPrevious} />
          )}
        </Box>
        <Text size="large" weight="bold">
          {stageHeading}
        </Text>
        <Box flex align="end" />
      </Box>
      <Box fill style={{ position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          <AnimatedBox
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            key={
              [PromptUiStage.CONTACT, PromptUiStage.RUNNERS].includes(currentStage!) &&
              !contactAndRunnersSeparate
                ? PromptUiStage.CONTACT
                : currentStage
            }
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -500, opacity: 0 }}
          >
            {currentStagePanel}
          </AnimatedBox>
        </AnimatePresence>
        <PrimaryPromptNav />
      </Box>
      <PromptStateManager />
    </Box>
  );
};

export default PromptStages;
