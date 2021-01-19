import React, { CSSProperties, FC } from 'react';
import { Box, Collapsible, Stack } from 'grommet';
import { shallowEqual } from 'react-redux';
import { animated, useSpring, useTransition } from 'react-spring';

import ContactPrompt from './ContactPrompt';
import FieldGraphic from './FieldGraphic';
import FielderPrompt from './FielderOverlay';
import RunnerPrompt from './RunnerOverlay';

import { getRunnerPromptBases, getSelectedBase } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';
import { usePromptContext } from '../../context';

const modes = ['fielders', 'runners'] as const;

const AnimatedBox = animated(Box);

interface Props {
  mode: typeof modes[number];
}

const Overlay: FC<Props & { style: CSSProperties }> = ({ mode, style }) => {
  const { fielderOptions, runnerOptions } = usePromptContext();
  return (
    <AnimatedBox style={style} fill>
      {mode === 'runners'
        ? runnerOptions && <RunnerPrompt {...runnerOptions} />
        : fielderOptions && <FielderPrompt {...fielderOptions} />}
    </AnimatedBox>
  );
};

const InteractiveFieldPanel: FC<Props> = ({ mode }) => {
  const { contactOptions, fielderOptions } = usePromptContext();
  // NOTE: this is causing unnecessary re-renders
  const runners = useAppSelector(getRunnerPromptBases, shallowEqual);
  const selectedBase = useAppSelector(getSelectedBase);

  const transitions = useTransition(
    modes.filter(m => m === mode),
    item => item,
    {
      from: { position: 'absolute', opacity: 0, top: '-50%' },
      enter: { opacity: 1, top: '0%' },
      leave: { opacity: 0, top: '-50%' },
    }
  );

  const marginSpring = useSpring({
    marginTop: mode === 'runners' ? '44px' : '8px',
  });

  const active = !!fielderOptions || mode === 'runners';
  const filterSpring = useSpring({
    opacity: active ? 1 : 0.7,
    saturation: active ? 0 : 1,
  });

  return (
    <Box>
      <Collapsible open={mode === 'fielders' && !!contactOptions}>
        <Box margin={{ top: 'small' }}>
          {contactOptions && <ContactPrompt {...contactOptions!} />}
        </Box>
      </Collapsible>
      <AnimatedBox
        alignSelf="center"
        flex={{ grow: 0, shrink: 0 }}
        basis="auto"
        height="medium"
        width="medium"
        style={{ marginTop: marginSpring.marginTop }}
      >
        <Stack>
          <AnimatedBox
            style={{
              opacity: filterSpring.opacity,
              filter: filterSpring.saturation.interpolate(s => `blur(${s * 2}px) grayscale(${s})`),
            }}
          >
            <FieldGraphic
              runnerMode={mode === 'runners'}
              selectedBase={selectedBase}
              runners={runners}
            />
          </AnimatedBox>
          {transitions.map(({ item, key, props }) => (
            <Overlay key={key} mode={item} style={props} />
          ))}
        </Stack>
      </AnimatedBox>
    </Box>
  );
};

export default InteractiveFieldPanel;
