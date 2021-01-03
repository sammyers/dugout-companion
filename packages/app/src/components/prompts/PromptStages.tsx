import React, { useMemo, ReactNode, useCallback } from 'react';
import Slider from '@farbenmeer/react-spring-slider';
import { Box, Button, Text } from 'grommet';
import { Next, Previous } from 'grommet-icons';

import InteractableField from './panels/InteractableField';
import OutOnPlayPrompt from './panels/OutOnPlayPrompt';
import SacFlyRbiPrompt from './panels/SacFlyRbiPrompt';
import PromptStateManager from './PromptStateManager';

import {
  canMoveToNextStage,
  canMoveToPreviousStage,
  getCurrentPromptStage,
  getPromptStages,
} from 'state/prompts/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { PromptUiStage } from 'state/prompts/types';
import { promptActions } from 'state/prompts/slice';

const PromptStages = () => {
  const dispatch = useAppDispatch();

  const currentStage = useAppSelector(getCurrentPromptStage);
  const allStages = useAppSelector(getPromptStages);
  const nextStageAvailable = useAppSelector(canMoveToNextStage);
  const previousStageAvailable = useAppSelector(canMoveToPreviousStage);

  const handleClickPrevious = useCallback(() => {
    dispatch(promptActions.goToPreviousStage());
  }, [dispatch]);

  const handleClickNext = useCallback(() => {
    dispatch(promptActions.goToNextStage());
  }, [dispatch]);

  const stageHeading = useMemo(() => {
    switch (currentStage) {
      case PromptUiStage.CONTACT:
        return 'Select contact details:';
      case PromptUiStage.RUNNERS:
        return 'Select final runner positions:';
      case PromptUiStage.OUTS_ON_PLAY:
        return 'Select runners out on the play:';
      case PromptUiStage.SAC_FLY_RBIS:
        return 'Select number of runs scored:';
    }
  }, [currentStage]);

  const [sliderPanes, activeIndex] = useMemo(() => {
    const panes: ReactNode[] = [];
    const contactAndRunnersSeparate = [
      PromptUiStage.CONTACT,
      PromptUiStage.OUTS_ON_PLAY,
      PromptUiStage.RUNNERS,
    ].every(stage => allStages.includes(stage));
    let currentIndex = 0;
    let index = 0;
    let contactStageIndex = 0;

    const updateIndex = (stage: PromptUiStage) => {
      if (stage === currentStage) {
        index = currentIndex;
      }
      currentIndex++;
    };

    allStages.forEach(stage => {
      switch (stage) {
        case PromptUiStage.SAC_FLY_RBIS:
          panes.push(<SacFlyRbiPrompt key={stage} />);
          updateIndex(stage);
          break;
        case PromptUiStage.CONTACT:
          panes.push(
            <InteractableField
              key={stage}
              mode={
                contactAndRunnersSeparate || currentStage === PromptUiStage.CONTACT
                  ? 'fielders'
                  : 'runners'
              }
            />
          );
          contactStageIndex = currentIndex;
          updateIndex(stage);
          break;
        case PromptUiStage.OUTS_ON_PLAY:
          panes.push(<OutOnPlayPrompt key={stage} />);
          updateIndex(stage);
          break;
        case PromptUiStage.RUNNERS:
          if (contactAndRunnersSeparate) {
            panes.push(<InteractableField key={stage} mode="runners" />);
            updateIndex(stage);
          } else {
            if (stage === currentStage) {
              index = contactStageIndex;
            }
          }
          break;
      }
    });
    return [panes, index];
  }, [allStages, currentStage]);

  return (
    <Box height="400px" width="large">
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
        <Box flex align="end">
          {nextStageAvailable && (
            <Button plain icon={<Next size="medium" />} onClick={handleClickNext} />
          )}
        </Box>
      </Box>
      <Slider activeIndex={activeIndex}>{sliderPanes}</Slider>
      <PromptStateManager />
    </Box>
  );
};

export default PromptStages;
