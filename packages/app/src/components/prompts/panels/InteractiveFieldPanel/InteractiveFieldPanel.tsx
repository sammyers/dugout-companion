import React, { CSSProperties, FC } from 'react';
import { Box, Stack } from 'grommet';
import { shallowEqual } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

import ContactPrompt from './ContactPrompt';
import FieldGraphic from './FieldGraphic';
import FielderPrompt from './FielderOverlay';
import RunnerPrompt from './RunnerOverlay';

import { getRunnerPromptBases, getSelectedBase } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';
import { usePromptContext } from '../../context';

const modes = ['fielders', 'runners'] as const;

const AnimatedBox = motion(Box);

interface Props {
  mode: typeof modes[number];
}

const Overlay: FC<Props & { style: CSSProperties }> = ({ mode, style }) => {
  const { fielderOptions, runnerOptions } = usePromptContext();
  return (
    <Box style={style} fill>
      {mode === 'runners'
        ? runnerOptions && <RunnerPrompt {...runnerOptions} />
        : fielderOptions && <FielderPrompt {...fielderOptions} />}
    </Box>
  );
};

const InteractiveFieldPanel: FC<Props> = ({ mode }) => {
  const { contactOptions } = usePromptContext();
  // NOTE: this is causing unnecessary re-renders
  const runners = useAppSelector(getRunnerPromptBases, shallowEqual);
  const selectedBase = useAppSelector(getSelectedBase);

  const overlays = modes.filter(m => m === mode);

  return (
    <Box style={{ position: 'relative' }}>
      <AnimatePresence>
        {mode === 'fielders' && !!contactOptions && (
          <AnimatedBox
            background="white"
            margin={{ top: 'small' }}
            style={{ position: 'absolute', left: 0, right: 0, zIndex: 3 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {contactOptions && <ContactPrompt {...contactOptions!} />}
          </AnimatedBox>
        )}
      </AnimatePresence>
      <Box
        alignSelf="center"
        flex={{ grow: 0, shrink: 0 }}
        basis="auto"
        height="medium"
        width="medium"
        style={{
          overflowY: mode === 'runners' ? 'visible' : 'hidden',
          overflowX: 'visible',
          marginTop: mode === 'runners' ? 44 : contactOptions ? 64 : 8,
        }}
      >
        <Stack>
          <Box
            style={{
              aspectRatio: '10/7',
            }}
          >
            <FieldGraphic
              runnerMode={mode === 'runners'}
              selectedBase={selectedBase}
              runners={runners}
            />
          </Box>
          {overlays.map(item => (
            <Overlay key={item} mode={item} style={{ position: 'absolute', top: 0 }} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default InteractiveFieldPanel;
