import React from "react";
import { Avatar, Box, Grommet, Heading } from "grommet";
import { User } from "grommet-icons";
import { Route, Routes } from "react-router";

import Dashboard from "./Dashboard";
import GamesPage from "./GamesPage";
import GamePage from "./GamePage";

import theme from "../theme";

const App = () => {
  return (
    <Grommet
      style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}
      theme={theme}
    >
      <Box flex>
        <Box direction="row" justify="between" align="center" pad="small">
          <Heading level={3} margin={{ horizontal: "small", vertical: "none" }}>
            Dugout Companion Stats
          </Heading>
          <Avatar size="medium" border={{ color: "neutral-5" }}>
            <User size="medium" />
          </Avatar>
        </Box>
        <Box flex>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/game/:id" element={<GamePage />} />
          </Routes>
        </Box>
      </Box>
    </Grommet>
  );
};

export default App;
