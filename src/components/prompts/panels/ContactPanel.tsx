import React, { FC } from 'react';
import { Box } from 'grommet';

import ContactPrompt from '../subprompts/ContactPrompt';
import FielderPrompt from '../subprompts/FielderPrompt';
import { PromptAccordionPanel } from '../PromptAccordion';

import { ContactOptions, FielderOptions } from 'state/prompts/types';

interface Props {
  contactOptions: ContactOptions;
  fielderOptions?: FielderOptions;
}

const ContactPanel: FC<Props> = ({ contactOptions, fielderOptions }) => (
  <PromptAccordionPanel label="Contact" preview="">
    <Box gap="small">
      <ContactPrompt {...contactOptions} />
      {fielderOptions && <FielderPrompt {...fielderOptions} showTitle={false} />}
    </Box>
  </PromptAccordionPanel>
);

export default ContactPanel;
