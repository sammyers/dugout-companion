import React, {
  createContext,
  CSSProperties,
  FC,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Box, Button, Layer, Notification, Stack, Text } from 'grommet';
import _ from 'lodash';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider, usePreview } from 'react-dnd-multi-backend';

import FieldGraphic from '../prompts/panels/InteractiveFieldPanel/FieldGraphic';

import {
  FieldingPosition,
  getPositionAbbreviation,
  Maybe,
  ordinalSuffix,
} from '@sammyers/dc-shared';
import { gameActions } from 'state/game/slice';
import {
  getBattingLineup,
  getFieldingLineup,
  getPreviousHalfInning,
  isRetroactiveFielderChangePossible,
} from 'state/game/selectors';
import { getAvailablePositionsForLineup } from 'state/game/utils';
import { getShortPlayerName } from 'state/players/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

type FielderMap = Record<string, Maybe<FieldingPosition>>;

interface FielderContext {
  fielders: FielderMap;
  moveFielder: (playerId: string, position: FieldingPosition | null, playerToSwap?: string) => void;
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

  const playerId = _.findKey(fielders, pos => pos === position);

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
      {playerId ? (
        <Fielder key={playerId} playerId={playerId} isOver={isOver} />
      ) : (
        <Box
          pad={{ horizontal: 'medium', vertical: 'small' }}
          round="medium"
          border={{ color: 'dark-1', size: '3px' }}
          background={isOver ? 'accent-3' : 'neutral-4'}
        >
          {getPositionAbbreviation(position)}
        </Box>
      )}
    </Box>
  );
};

const BenchSpot: FC<{ playerId: string }> = ({ playerId }) => {
  const { moveFielder } = useContext(fielderContext);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: FIELDER_DROP_TYPE,
    drop: (item: { id: string; name: string }) => {
      moveFielder(item.id, null, playerId);
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <Box ref={drop}>
      <Fielder key={playerId} playerId={playerId} isOver={isOver} />
    </Box>
  );
};

const DragPreview = () => {
  const preview = usePreview();
  if (!preview.display) {
    return null;
  }
  const { item, style } = preview;

  return <PlayerBubble name={item.name} style={{ ...style, zIndex: 25 }} />;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const FielderChange: FC<Props> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();

  const canChangeFieldersRetroactively = useAppSelector(isRetroactiveFielderChangePossible);
  const previousHalfInning = useAppSelector(getPreviousHalfInning);
  const [selectedHalfInning, setSelectedHalfInning] = useState<'current' | 'previous'>('current');

  const battingLineup = useAppSelector(getBattingLineup);
  const fieldingLineup = useAppSelector(getFieldingLineup);

  const lineupToEdit = useMemo(
    () => (selectedHalfInning === 'previous' ? battingLineup : fieldingLineup),
    [selectedHalfInning, battingLineup, fieldingLineup]
  );
  const originalFielders = useMemo(
    () => _.fromPairs(lineupToEdit.map(({ playerId, position }) => [playerId, position])),
    [lineupToEdit]
  );

  const [editedFielders, setEditedFielders] = useState<FielderMap>({} as FielderMap);

  const playersWithoutPositions = useMemo(
    () => _.keys(_.pickBy(editedFielders, position => !position)),
    [editedFielders]
  );

  // Initialize fielder state
  useEffect(() => {
    setEditedFielders(originalFielders);
  }, [open, originalFielders]);

  const moveFielder: FielderContext['moveFielder'] = useCallback(
    (playerId, position, playerToSwap) => {
      setEditedFielders(fielders => {
        if (!playerToSwap) {
          playerToSwap = _.findKey(fielders, pos => pos === position);
        }
        const oldPosition = fielders[playerId];
        if (position !== oldPosition) {
          return {
            ...fielders,
            [playerId]: position,
            ...(playerToSwap ? { [playerToSwap]: oldPosition } : undefined),
          };
        }
        return fielders;
      });
    },
    [setEditedFielders]
  );

  const handleSave = useCallback(() => {
    if (selectedHalfInning === 'current') {
      dispatch(gameActions.changePositionsCurrent(editedFielders));
    } else {
      dispatch(gameActions.changePositionsRetroactive(editedFielders));
    }
    onClose();
  }, [selectedHalfInning, dispatch, editedFielders, onClose]);

  if (!open) {
    return null;
  }

  return (
    <Layer full modal margin="medium" onClickOutside={onClose}>
      <Box flex pad={{ vertical: 'medium', horizontal: 'large' }} align="center" gap="small">
        <Text weight="bold">Drag players to update their positions.</Text>
        {canChangeFieldersRetroactively && (
          <Box gap="small">
            <Box direction="row" gap="small" alignSelf="center">
              <Button
                plain={false}
                size="large"
                primary={selectedHalfInning === 'current'}
                onClick={() => setSelectedHalfInning('current')}
              >
                Current Half-Inning
              </Button>
              <Button
                plain={false}
                size="large"
                primary={selectedHalfInning === 'previous'}
                onClick={() => setSelectedHalfInning('previous')}
              >
                Previous Half-Inning
              </Button>
            </Box>
            {selectedHalfInning === 'previous' && (
              <Notification
                status="warning"
                title={`This will retroactively update fielding positions in the ${_.lowerCase(
                  previousHalfInning![0]
                )} of the ${previousHalfInning![1]}${ordinalSuffix(
                  previousHalfInning![1]
                )} for the current batting team.`}
              />
            )}
          </Box>
        )}
        <Box flex style={{ aspectRatio: '10/7', position: 'relative' }}>
          <fielderContext.Provider value={{ fielders: editedFielders, moveFielder }}>
            <DndProvider options={HTML5toTouch}>
              <DragPreview />
              <Stack>
                <FieldGraphic runnerMode={false} />
                <Box style={{ position: 'absolute', top: 0, bottom: 0 }} fill>
                  {getAvailablePositionsForLineup(lineupToEdit).map(position => (
                    <Position key={position} position={position as FieldingPosition} />
                  ))}
                </Box>
              </Stack>
              {!!playersWithoutPositions.length && (
                <Box style={{ position: 'absolute', bottom: 0, left: 0 }} gap="xsmall">
                  <Text weight="bold" textAlign="center">
                    Bench
                  </Text>
                  <Box gap="small" align="center">
                    {playersWithoutPositions.map(playerId => (
                      <BenchSpot key={playerId} playerId={playerId} />
                    ))}
                  </Box>
                </Box>
              )}
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
            onClick={handleSave}
            disabled={_.isEqual(originalFielders, editedFielders)}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
    </Layer>
  );
};

export default FielderChange;
