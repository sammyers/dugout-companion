import React, { useContext } from "react";
import {
  Box,
  Grid,
  GridColumnsType,
  GridSizeType,
  ResponsiveContext,
  Text,
} from "grommet";
import GameWidget from "./GameWidget";

const columns: Record<string, GridColumnsType> = {
  small: ["auto"],
  medium: ["auto", "auto"],
  large: ["auto", "auto"],
  xlarge: ["auto", "auto", "auto"],
};

const rows: Record<string, GridSizeType[]> = {
  small: ["small", "large", "medium"],
  medium: ["auto", "auto"],
  large: ["auto", "auto"],
  xlarge: ["full"],
};

const areas = {
  small: [
    { name: "game", start: [0, 0], end: [0, 0] },
    { name: "stats", start: [0, 1], end: [0, 1] },
    { name: "leaderboard", start: [0, 2], end: [0, 2] },
  ],
  medium: [
    { name: "game", start: [0, 0], end: [0, 0] },
    { name: "stats", start: [1, 0], end: [1, 1] },
    { name: "leaderboard", start: [0, 1], end: [0, 1] },
  ],
  large: [
    { name: "game", start: [0, 0], end: [0, 0] },
    { name: "stats", start: [1, 0], end: [1, 1] },
    { name: "leaderboard", start: [0, 1], end: [0, 1] },
  ],
  xlarge: [
    { name: "game", start: [0, 0], end: [0, 0] },
    { name: "stats", start: [1, 0], end: [1, 0] },
    { name: "leaderboard", start: [2, 0], end: [2, 0] },
  ],
};

const Dashboard = () => {
  const size = useContext(ResponsiveContext);
  return (
    <Box flex="grow">
      <Grid
        style={{ flexGrow: 1 }}
        pad={{ horizontal: "medium", bottom: "medium", top: "xsmall" }}
        gap="medium"
        columns={columns[size]}
        rows={rows[size]}
        areas={areas[size as keyof typeof areas]}
      >
        <GameWidget />
        <Box gridArea="stats" round="small" background="neutral-5" pad="small">
          <Text>Stats</Text>
        </Box>
        <Box
          gridArea="leaderboard"
          round="small"
          background="neutral-5"
          pad="small"
        >
          <Text>Leaderboards</Text>
        </Box>
      </Grid>
    </Box>
  );
};

export default Dashboard;
