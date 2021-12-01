import React, { FC, useCallback, useState } from "react";
import { Box, Button, Collapsible, List, Text } from "grommet";
import { FormDown, FormNext } from "grommet-icons";
import _ from "lodash";
import { useParams } from "react-router";

import {
  GetGameLogQueryResult,
  PlateAppearanceType,
  useGetGameLogQuery,
} from "@sammyers/dc-shared";

const getPlateAppearanceLabel = (paType: PlateAppearanceType) =>
  ({
    [PlateAppearanceType.OUT]: "Out",
    [PlateAppearanceType.SINGLE]: "Single",
    [PlateAppearanceType.DOUBLE]: "Double",
    [PlateAppearanceType.TRIPLE]: "Triple",
    [PlateAppearanceType.HOMERUN]: "Home Run",
    [PlateAppearanceType.WALK]: "Walk",
    [PlateAppearanceType.SACRIFICE_FLY]: "Sacrifice Fly",
    [PlateAppearanceType.FIELDERS_CHOICE]: "Fielder's Choice",
    [PlateAppearanceType.DOUBLE_PLAY]: "Double Play",
  }[paType]);

const ordinalSuffix = (n: number) =>
  Math.floor(n / 10) === 1
    ? "th"
    : n % 10 === 1
    ? "st"
    : n % 10 === 2
    ? "nd"
    : n % 10 === 3
    ? "rd"
    : "th";

type GameLogEvent = NonNullable<
  NonNullable<GetGameLogQueryResult["data"]>["game"]
>["gameEventRecords"][number];
type GameLogState = NonNullable<
  NonNullable<GetGameLogQueryResult["data"]>["game"]
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

const GamePage = () => {
  const { id } = useParams();
  const { data } = useGetGameLogQuery({ variables: { id: id! } });

  const [visibileInnings, setVisibleInnings] = useState<
    Record<string, boolean>
  >({});

  const toggleInningVisible = useCallback(
    (inning: string) => {
      setVisibleInnings((innings) => ({
        ...innings,
        [inning]: !innings[inning],
      }));
    },
    [setVisibleInnings]
  );

  if (!data) {
    return null;
  }

  const { gameLength, gameStates, gameEventRecords } = data.game!;

  const gameStatesMap = Object.fromEntries(
    gameStates.map((state) => [state.id, state])
  );

  const gameEventsByInning = _.sortBy(
    _.toPairs(
      _.mapValues(
        _.groupBy(gameEventRecords, (event) => event.gameStateBefore?.inning),
        (events) =>
          _.groupBy(events, (event) => event.gameStateBefore?.halfInning)
      )
    ),
    0
  );

  return (
    <Box flex>
      {gameEventsByInning.map(
        ([inning, { TOP: topInningEvents, BOTTOM: bottomInningEvents }]) => {
          const open = visibileInnings[inning];
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

export default GamePage;
