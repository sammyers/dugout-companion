import React from "react";
import { Box, ColumnConfig, DataTable } from "grommet";
import {
  GetAllPlayerStatsQuery,
  SimplifyType,
  useGetAllPlayerStatsQuery,
} from "@sammyers/dc-shared";

type PlayerStatResult = NonNullable<
  SimplifyType<GetAllPlayerStatsQuery["players"]>
>[number];
type PlayerStatRow = SimplifyType<
  Omit<PlayerStatResult, "traditionalStats"> &
    PlayerStatResult["traditionalStats"]
>;
const columns: ColumnConfig<PlayerStatRow>[] = [
  {
    property: "fullName",
    header: "Player",
  },
  {
    property: "games",
    header: "G",
  },
  {
    property: "atBats",
    header: "AB",
  },
  {
    property: "hits",
    header: "H",
  },
  {
    property: "doubles",
    header: "2B",
  },
  {
    property: "triples",
    header: "3B",
  },
  {
    property: "homeruns",
    header: "HR",
  },
  {
    property: "walks",
    header: "BB",
  },
  {
    property: "onBasePct",
    header: "OBP",
    render: (row) => row.onBasePct!.toFixed(3),
  },
  {
    property: "ops",
    header: "OPS",
    render: (row) => row.ops!.toFixed(3),
  },
];

const StatsWidget = () => {
  const { data } = useGetAllPlayerStatsQuery();

  if (!data) {
    return null;
  }

  const rows = data.players!.map(({ traditionalStats, ...player }) => ({
    ...player,
    ...traditionalStats!,
  }));

  return (
    <Box
      gridArea="stats"
      round="small"
      background="neutral-5"
      pad="small"
      align="center"
      gap="small"
    >
      <DataTable sortable columns={columns} data={rows}></DataTable>
    </Box>
  );
};

export default StatsWidget;
