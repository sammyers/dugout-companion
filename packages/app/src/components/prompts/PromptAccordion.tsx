import React, {
  Children,
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Accordion, AccordionPanel, Box, Text } from 'grommet';
import { Edit } from 'grommet-icons';
import _ from 'lodash';

const promptAccordionContext = createContext(false);

const PromptAccordion: FC = ({ children }) => {
  const numPanels = Children.count(children);

  const [activeIndices, setActiveIndices] = useState(_.range(numPanels));

  const handleActiveIndicesChange = useCallback(
    (indices: number[]) => {
      setActiveIndices(currentIndices => {
        if (indices.length > currentIndices.length) {
          return _.sortBy(indices).slice(1);
        }
        return currentIndices;
      });
    },
    [setActiveIndices]
  );

  return (
    <Accordion
      multiple
      activeIndex={activeIndices}
      onActive={handleActiveIndicesChange}
      gap="small"
    >
      {Children.map(children, (child, i) => (
        <promptAccordionContext.Provider key={i} value={activeIndices.includes(i)}>
          {child}
        </promptAccordionContext.Provider>
      ))}
    </Accordion>
  );
};

interface PromptAccordionPanelProps {
  label: string;
  preview: ReactNode;
}

export const PromptAccordionPanel: FC<PromptAccordionPanelProps> = ({
  label,
  preview,
  children,
}) => {
  const active = useContext(promptAccordionContext);

  return (
    <AccordionPanel
      header={
        <Box
          direction="row"
          justify="between"
          pad="small"
          round="4px"
          background={active ? undefined : 'brand'}
        >
          <Text weight="bold">{label}</Text>
          {!active && (
            <>
              {preview}
              <Edit />
            </>
          )}
        </Box>
      }
    >
      {children}
    </AccordionPanel>
  );
};

export default PromptAccordion;
