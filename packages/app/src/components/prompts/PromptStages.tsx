import React, { useMemo, ReactNode, useCallback } from 'react';
import Slider from '@farbenmeer/react-spring-slider';
import { Box, Button, Text } from 'grommet';
import { Previous } from 'grommet-icons';

import InteractableField from './panels/InteractableField';
import OutOnPlayPrompt from './panels/OutOnPlayPrompt';
import SacFlyRbiPrompt from './panels/SacFlyRbiPrompt';
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
import PromptSummary from './panels/PromptSummary';

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
        case PromptUiStage.SUMMARY:
          panes.push(<PromptSummary />);
          updateIndex(stage);
          break;
      }
    });
    return [panes, index];
  }, [allStages, currentStage]);

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
      <Slider activeIndex={activeIndex}>{sliderPanes}</Slider>
      <PrimaryPromptNav />
      <PromptStateManager />
    </Box>
  );
};

export default PromptStages;
