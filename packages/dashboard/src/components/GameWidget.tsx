import React, { FC } from "react";
import { Box, Button, Heading, Text } from "grommet";
import { format, parseISO } from "date-fns";

import { Game, useGetLatestGameSummaryQuery } from "@sammyers/dc-shared";
import { useNavigate } from "react-router";

const GameSummary: FC<Pick<Game, "timeStarted" | "timeEnded" | "score">> = ({
  timeStarted,
  timeEnded,
  score,
}) => {
  const winningScore = Math.max(...(score as number[]));

  return (
    <>
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
    </>
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
    >
      {game ? <GameSummary {...game} /> : <Text>No games yet</Text>}
      <Button plain={false} color="accent-2" onClick={() => navigate("/games")}>
        More Games
      </Button>
    </Box>
  );
};

export default GameWidget;
