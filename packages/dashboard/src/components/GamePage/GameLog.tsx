import React, { FC, useCallback, useMemo, useState } from "react";
import { Box, Button, Collapsible, List, Text } from "grommet";
import { FormDown, FormNext } from "grommet-icons";
import _ from "lodash";

import {
  GetGameDetailsQuery,
  getPlateAppearanceLabel,
  ordinalSuffix,
} from "@sammyers/dc-shared";

type GameLogEvent = NonNullable<
  NonNullable<GetGameDetailsQuery>["game"]
>["gameEventRecords"][number];
type GameLogState = NonNullable<
  NonNullable<GetGameDetailsQuery>["game"]
>["gameStates"][number];

const HalfInningEventList: FC<{
  events: GameLogEvent[];
  states: Record<string, GameLogState>;
}> = ({ events, states }) => {
  return (
    <List
      border={false}
      margin="small"
      data={events.filter((event) => !!event.gameEvent?.plateAppearance)}
      primaryKey={(event) => (
        <Text weight="bold">
          {getPlateAppearanceLabel(event.gameEvent!.plateAppearance!.type)}
        </Text>
      )}
      secondaryKey={(event) => {
        const { firstName, lastName } =
          event.gameStateBefore!.playerByPlayerAtBat!;
        return (
          <Text>
            {firstName} {lastName}
          </Text>
        );
      }}
    />
  );
};

interface Props {
  events: GameLogEvent[];
  states: GameLogState[];
}

const GameLog: FC<Props> = ({ events, states }) => {
  const [visibleInnings, setVisibleInnings] = useState<Record<string, boolean>>(
    {}
  );

  const gameStatesMap = useMemo(
    () => Object.fromEntries(states.map((state) => [state.id, state])),
    [states]
  );

  const gameEventsByInning = useMemo(
    () =>
      _.sortBy(
        _.toPairs(
          _.mapValues(
            _.groupBy(events, (event) => event.gameStateBefore?.inning),
            (events) =>
              _.groupBy(events, (event) => event.gameStateBefore?.halfInning)
          )
        ),
        0
      ),
    [events]
  );

  const toggleInningVisible = useCallback(
    (inning: string) => {
      setVisibleInnings((innings) => ({
        ...innings,
        [inning]: !innings[inning],
      }));
    },
    [setVisibleInnings]
  );

  return (
    <Box flex>
      {gameEventsByInning.map(
        ([inning, { TOP: topInningEvents, BOTTOM: bottomInningEvents }]) => {
          const open = visibleInnings[inning];
          const inningOrdinal = `${inning}${ordinalSuffix(Number(inning))}`;
          return (
            <>
              <Box direction="row" align="center" pad="xsmall">
                {open ? <FormDown /> : <FormNext />}
                <Button onClick={() => toggleInningVisible(inning)}>
                  {inningOrdinal} Inning
                </Button>
              </Box>
              <Collapsible open={open}>
                <Box pad={{ horizontal: "medium", vertical: "small" }}>
                  <Text weight="bold">Top {inningOrdinal}</Text>
                  <HalfInningEventList
                    events={topInningEvents}
                    states={gameStatesMap}
                  />
                  {bottomInningEvents && (
                    <>
                      <Text weight="bold">Bottom {inningOrdinal}</Text>
                      <HalfInningEventList
                        events={bottomInningEvents}
                        states={gameStatesMap}
                      />
                    </>
                  )}
                </Box>
              </Collapsible>
            </>
          );
        }
      )}
    </Box>
  );
};

export default GameLog;
