import React, {
  createContext,
  CSSProperties,
  FC,
  forwardRef,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Box, Button, Layer, Stack, Text } from 'grommet';
import _ from 'lodash';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider, usePreview } from 'react-dnd-multi-backend';

import FieldGraphic from '../prompts/panels/InteractiveFieldPanel/FieldGraphic';

import { getShortPlayerName } from 'state/players/selectors';
import { useAppSelector } from 'utils/hooks';

import { FieldingPosition } from '@sammyers/dc-shared';

type FielderMap = Record<FieldingPosition, string>;

interface FielderContext {
  fielders: FielderMap;
  moveFielder: (playerId: string, position: FieldingPosition) => void;
}

const fielderContext = createContext<FielderContext>({
  fielders: {} as FielderMap,
  moveFielder: () => {},
});

const pct = (val: number) => `${val}%`;

const FIELDER_DROP_TYPE = 'FIELDER';

const positions: Record<FieldingPosition, CSSProperties> = {
  [FieldingPosition.PITCHER]: { top: 62, left: 50 },
  [FieldingPosition.CATCHER]: { top: 82, left: 50 },
  [FieldingPosition.FIRST_BASE]: { top: 55, right: 31 },
  [FieldingPosition.SECOND_BASE]: { top: 38, right: 38 },
  [FieldingPosition.THIRD_BASE]: { top: 55, left: 31 },
  [FieldingPosition.SHORTSTOP]: { top: 38, left: 38 },
  [FieldingPosition.LEFT_FIELD]: { top: 25, left: 22 },
  [FieldingPosition.CENTER_FIELD]: { top: 12, left: 50 },
  [FieldingPosition.LEFT_CENTER]: { top: 15, left: 40 },
  [FieldingPosition.RIGHT_CENTER]: { top: 15, right: 40 },
  [FieldingPosition.RIGHT_FIELD]: { top: 25, right: 22 },
};

const PlayerBubble = forwardRef<
  HTMLDivElement,
  { name: string; color?: string; style: CSSProperties }
>(({ name, color, style }, ref) => (
  <Box
    ref={ref}
    round="medium"
    pad="small"
    background={color ?? 'white'}
    border={{ color: 'dark-1', size: '3px' }}
    style={style}
  >
    <Text>{name}</Text>
  </Box>
));

const Fielder: FC<{ playerId: string; isOver: boolean }> = ({ playerId, isOver }) => {
  const name = useAppSelector(state => getShortPlayerName(state, playerId));

  const [{ isDragging }, drag] = useDrag(() => ({
    type: FIELDER_DROP_TYPE,
    item: { id: playerId, name },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <PlayerBubble
      name={name}
      ref={drag}
      color={isOver ? 'accent-3' : 'white'}
      style={{
        cursor: 'move',
        userSelect: 'none',
        opacity: isDragging ? 0.5 : 1,
      }}
    />
  );
};

const Position: FC<{ position: FieldingPosition }> = ({ position }) => {
  const { fielders, moveFielder } = useContext(fielderContext);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: FIELDER_DROP_TYPE,
    drop: (item: { id: string; name: string }) => {
      moveFielder(item.id, position);
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
    }),
  }));

  const positionStyle = positions[position];

  return (
    <Box
      ref={drop}
      style={{
        ...(_.mapValues(positionStyle, pct) as CSSProperties),
        position: 'absolute',
        transform: `translateX(${positionStyle.left ? '-' : ''}50%)`,
      }}
    >
      <Fielder key={fielders[position]} playerId={fielders[position]} isOver={isOver} />
    </Box>
  );
};

const DragPreview = () => {
  const preview = usePreview();
  if (!preview.display) {
    return null;
  }
  const { item, style, ref } = preview;

  return (
    <PlayerBubble
      name={item.name}
      ref={ref as RefObject<HTMLDivElement>}
      style={{ ...style, zIndex: 25 }}
    />
  );
};

interface Props {
  open: boolean;
  fielders: FielderMap;
  onClose: () => void;
  onSave: (fielders: FielderMap) => void;
}

const FielderChange: FC<Props> = ({ open, fielders, onClose, onSave }) => {
  const [editedFielders, setEditedFielders] = useState<FielderMap>({} as FielderMap);

  // Initialize fielder state
  useEffect(() => {
    setEditedFielders(fielders);
  }, [open, fielders]);

  const moveFielder: FielderContext['moveFielder'] = useCallback(
    (playerId, position) => {
      setEditedFielders(fielders => {
        const playerToSwap = fielders[position];
        const oldPosition = _.findKey(fielders, p => p === playerId) as FieldingPosition;
        return {
          ...fielders,
          [position]: playerId,
          [oldPosition]: playerToSwap,
        };
      });
    },
    [setEditedFielders]
  );

  if (!open) {
    return null;
  }

  return (
    <Layer full modal margin="medium" onClickOutside={onClose}>
      <Box flex pad={{ vertical: 'medium', horizontal: 'large' }} align="center" gap="medium">
        <Text textAlign="center">
          Drag players (from the current batting team) to retroactively update their fielding
          positions for the previous half inning.
        </Text>
        <Box flex style={{ aspectRatio: '10/7' }}>
          <fielderContext.Provider value={{ fielders: editedFielders, moveFielder }}>
            <DndProvider options={HTML5toTouch}>
              <DragPreview />
              <Stack>
                <FieldGraphic runnerMode={false} />
                <Box style={{ position: 'absolute', top: 0, bottom: 0 }} fill>
                  {_.keys(fielders).map(position => (
                    <Position key={position} position={position as FieldingPosition} />
                  ))}
                </Box>
              </Stack>
            </DndProvider>
          </fielderContext.Provider>
        </Box>
        <Box direction="row" align="center" gap="small">
          <Button primary plain={false} color="status-critical" onClick={onClose}>
            Cancel
          </Button>
          <Button
            plain={false}
            primary
            onClick={() => onSave(editedFielders)}
            disabled={_.isEqual(fielders, editedFielders)}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
    </Layer>
  );
};

export default FielderChange;
