import React, { useMemo, ReactNode, useCallback } from 'react';
import Slider from '@farbenmeer/react-spring-slider';
import { Box, Button, Text } from 'grommet';
import { FormNextLink, FormPreviousLink } from 'grommet-icons';

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
    <Box height="medium" width="large">
      <Box direction="row" justify="between" align="center" background="brand" pad="small">
        <Button
          plain
          icon={<FormPreviousLink size="medium" />}
          disabled={!previousStageAvailable}
          onClick={handleClickPrevious}
        />
        <Text>Current Stage</Text>
        <Button
          plain
          icon={<FormNextLink size="medium" />}
          disabled={!nextStageAvailable}
          onClick={handleClickNext}
        />
      </Box>
      <Slider activeIndex={activeIndex}>{sliderPanes}</Slider>
      <PromptStateManager />
    </Box>
  );
};

export default PromptStages;
