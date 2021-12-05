import React, { FC } from "react";
import { format, parseISO } from "date-fns";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
} from "grommet";
import _ from "lodash";

import {
  Game,
  useGetLatestGameSummaryQuery,
  useGetLineScoreQuery,
} from "@sammyers/dc-shared";
import { useNavigate } from "react-router";

const INNING_WIDTH = "16px";
const RUNS_WIDTH = "48px";
const HITS_WIDTH = INNING_WIDTH;

const GameSummary: FC<
  Pick<Game, "id" | "timeStarted" | "timeEnded" | "score">
> = ({ id, timeStarted, timeEnded, score }) => {
  const winningScore = Math.max(...(score as number[]));

  const { data } = useGetLineScoreQuery({ variables: { gameId: id } });

  const { TOP, BOTTOM } = _.groupBy(
    _.orderBy(data?.game?.lineScore, "inning"),
    "halfInning"
  );

  if (!TOP || !BOTTOM) {
    return null;
  }

  return (
    <Box>
      <Text color="accent-3">
        Latest Game: {format(parseISO(timeStarted), "MMMM d, h:mmaaa")}
        {" - "}
        {format(parseISO(timeEnded), "h:mmaaa")}
      </Text>
      <Text margin="medium" weight="bold">
        <Text
          size="large"
          color={score[0] === winningScore ? "status-ok" : "status-critical"}
        >
          Away {score[0]}
        </Text>
        {" - "}
        <Text
          size="large"
          color={score[1] === winningScore ? "status-ok" : "status-critical"}
        >
          {score[1]} Home
        </Text>
      </Text>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell scope="col"></TableCell>
            {_.times(Math.max(TOP.length, BOTTOM.length), (n) => (
              <TableCell key={n} scope="col" align="center" size={INNING_WIDTH}>
                {n + 1}
              </TableCell>
            ))}
            <TableCell scope="col" align="right" size={RUNS_WIDTH}>
              <strong>R</strong>
            </TableCell>
            <TableCell scope="col" align="right" size={HITS_WIDTH}>
              <strong>H</strong>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(
            [
              ["Away", TOP],
              ["Home", BOTTOM],
            ] as [string, typeof TOP][]
          ).map(([name, innings]) => (
            <TableRow key={name}>
              <TableCell scope="row">
                <strong>{name}</strong>
              </TableCell>
              {innings.map((inning) => (
                <TableCell
                  key={inning?.inning}
                  align="center"
                  size={INNING_WIDTH}
                >
                  {inning!.runs}
                </TableCell>
              ))}
              <TableCell align="right" size={RUNS_WIDTH}>
                <strong>{_.sumBy(innings, "runs")}</strong>
              </TableCell>
              <TableCell align="right" size={HITS_WIDTH}>
                <strong>{_.sumBy(innings, "hits")}</strong>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

const GameWidget = () => {
  const { data } = useGetLatestGameSummaryQuery();
  const game = data?.games?.[0];

  const navigate = useNavigate();

  return (
    <Box
      gridArea="game"
      round="small"
      background="neutral-5"
      pad="small"
      align="center"
      gap="small"
    >
      {game ? <GameSummary {...game} /> : <Text>No games yet</Text>}
      <Box direction="row" gap="small">
        {!!game && (
          <Button
            plain={false}
            color="accent-2"
            onClick={() => navigate(`/game/${game?.id}`)}
          >
            More Details
          </Button>
        )}
        <Button
          plain={false}
          color="accent-2"
          onClick={() => navigate("/games")}
        >
          More Games
        </Button>
      </Box>
    </Box>
  );
};

export default GameWidget;
