import { add, format, formatISO } from 'date-fns';
import _ from 'lodash';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { v4 } from 'uuid';

import {
  GameInput,
  HalfInning,
  LineupGameIdFkeyLineupCreateInput,
  ManualEntryBattingLineGameIdFkeyManualEntryBattingLineCreateInput,
  ManualEntryLineScoreCellGameIdFkeyManualEntryLineScoreCellCreateInput,
  TeamRole,
} from '@sammyers/dc-shared';

type BattingLine = Omit<
  ManualEntryBattingLineGameIdFkeyManualEntryBattingLineCreateInput,
  'teamId' | 'team' | 'game' | 'player' | 'hits' | 'atBats' | 'playerId'
> & { playerId: string };

const newBattingLine = (playerId: string): BattingLine => ({
  playerId,
  plateAppearances: 0,
  singles: 0,
  doubles: 0,
  triples: 0,
  homeruns: 0,
  walks: 0,
  sacFlies: 0,
  stolenBases: 0,
  strikeouts: 0,
  gidp: 0,
  runs: 0,
  rbi: 0,
});

interface StatsEntryState {
  stats: Record<TeamRole, BattingLine[]>;
}

interface StatsEntryActions {
  actions: {
    addPlayer: (teamRole: TeamRole, playerId: string) => void;
    removePlayer: (teamRole: TeamRole, playerId: string) => void;
    setValue: (
      teamRole: TeamRole,
      playerId: string,
      column: keyof Omit<BattingLine, 'playerId'>,
      value: number
    ) => void;
  };
}

export const useStatsEntryStore = create(
  persist(
    immer<StatsEntryState & StatsEntryActions>(set => ({
      stats: { [TeamRole.HOME]: [], [TeamRole.AWAY]: [] },
      actions: {
        addPlayer: (teamRole, playerId) =>
          set(state => {
            state.stats[teamRole].push(newBattingLine(playerId));
          }),
        removePlayer: (teamRole, playerId) =>
          set(state => {
            state.stats[teamRole] = state.stats[teamRole].filter(
              player => player.playerId !== playerId
            );
          }),
        setValue: (teamRole, playerId, column, value) =>
          set(state => {
            const stats = state.stats[teamRole].find(player => player.playerId === playerId)!;
            stats[column] = value;
            const minPlateAppearances =
              stats.singles +
              stats.doubles +
              stats.triples +
              stats.homeruns +
              stats.walks +
              stats.sacFlies +
              stats.strikeouts +
              stats.gidp;
            if (stats.plateAppearances < minPlateAppearances) {
              stats.plateAppearances = minPlateAppearances;
            }
          }),
      },
    })),
    { name: 'stats-storage', partialize: state => _.omit(state, 'actions') }
  )
);

interface TeamNamesState {
  names: Record<TeamRole, string>;
}

interface TeamNamesActions {
  actions: {
    setName: (teamRole: TeamRole, name: string) => void;
  };
}

export const useTeamNamesStore = create(
  persist(
    immer<TeamNamesState & TeamNamesActions>(set => ({
      names: { [TeamRole.HOME]: '', [TeamRole.AWAY]: '' },
      actions: {
        setName: (teamRole, name) =>
          set(state => {
            state.names[teamRole] = name;
          }),
      },
    })),
    { name: 'team-names-storage', partialize: state => _.omit(state, 'actions') }
  )
);

interface GameInfoState {
  name: string;
  date: string;
  endTime: string;
}

interface GameInfoActions {
  actions: {
    setName: (name: string) => void;
    setDate: (date: string) => void;
    setEndTime: (time: string) => void;
  };
}

export const useGameInfoStore = create(
  persist(
    immer<GameInfoState & GameInfoActions>(set => ({
      name: '',
      date: '',
      endTime: '',
      actions: {
        setName: name =>
          set(state => {
            state.name = name;
          }),
        setDate: date =>
          set(state => {
            state.date = date;
            state.endTime = format(add(new Date(date), { hours: 1 }), 'HH:mm');
          }),
        setEndTime: time =>
          set(state => {
            state.endTime = time;
          }),
      },
    })),
    { name: 'game-info-storage', partialize: state => _.omit(state, 'actions') }
  )
);

interface LineScoreEntryState {
  runsPerInning: Record<TeamRole, number[]>;
}

interface LineScoreEntryActions {
  actions: {
    setRuns: (teamRole: TeamRole, inning: number, runs: number) => void;
    addInning: () => void;
    removeInning: () => void;
  };
}

export const useLineScoreEntryStore = create(
  persist(
    immer<LineScoreEntryState & LineScoreEntryActions>(set => ({
      runsPerInning: {
        [TeamRole.AWAY]: [0, 0, 0, 0, 0, 0, 0],
        [TeamRole.HOME]: [0, 0, 0, 0, 0, 0, 0],
      },
      actions: {
        setRuns: (teamRole, inning, runs) =>
          set(state => {
            state.runsPerInning[teamRole][inning] = runs;
            if (state.runsPerInning.AWAY.length === state.runsPerInning.HOME.length) {
              if (_.sum(state.runsPerInning.AWAY) < _.sum(_.dropRight(state.runsPerInning.HOME))) {
                state.runsPerInning.HOME.pop();
              }
            } else {
              if (_.sum(state.runsPerInning.AWAY) >= _.sum(state.runsPerInning.HOME)) {
                state.runsPerInning.HOME.push(0);
              }
            }
          }),
        addInning: () =>
          set(state => {
            state.runsPerInning.AWAY.push(0);
            state.runsPerInning.HOME.push(0);
          }),
        removeInning: () =>
          set(state => {
            state.runsPerInning.AWAY.pop();
            state.runsPerInning.HOME.pop();
          }),
      },
    })),
    { name: 'line-score-storage', partialize: state => _.omit(state, 'actions') }
  )
);

export const isRunTotalValid = (
  runsPerInning: LineScoreEntryState['runsPerInning'],
  boxScoreStats: StatsEntryState['stats']
) => {
  const boxScoreAwayTeamRuns = _.sumBy(boxScoreStats.AWAY, 'runs');
  const boxScoreHomeTeamRuns = _.sumBy(boxScoreStats.HOME, 'runs');
  const lineScoreAwayTeamRuns = _.sum(runsPerInning.AWAY);
  const lineScoreHomeTeamRuns = _.sum(runsPerInning.HOME);

  return (
    boxScoreAwayTeamRuns === lineScoreAwayTeamRuns && boxScoreHomeTeamRuns === lineScoreHomeTeamRuns
  );
};

export const isRbiTotalValid = (stats: StatsEntryState['stats'][TeamRole]) => {
  return _.sumBy(stats, 'rbi') <= _.sumBy(stats, 'runs');
};

export const canSaveGame = (
  stats: StatsEntryState['stats'],
  gameInfo: GameInfoState,
  runsPerInning: LineScoreEntryState['runsPerInning']
) => {
  const awayLineup = stats.AWAY;
  const homeLineup = stats.HOME;

  return (
    awayLineup.length >= 8 &&
    homeLineup.length >= 8 &&
    !!gameInfo.name &&
    !!gameInfo.date &&
    !!gameInfo.endTime &&
    isRunTotalValid(runsPerInning, stats) &&
    isRbiTotalValid(stats.AWAY) &&
    isRbiTotalValid(stats.HOME)
  );
};

const buildLineupInput = (
  battingLines: BattingLine[],
  gameId: string,
  teamId: string
): LineupGameIdFkeyLineupCreateInput => ({
  teamId,
  lineupSpots: {
    create: battingLines.map(({ playerId }, battingOrder) => ({ playerId, battingOrder, gameId })),
  },
});

const buildBattingLineInputs = (
  battingLines: BattingLine[],
  teamId: string
): ManualEntryBattingLineGameIdFkeyManualEntryBattingLineCreateInput[] =>
  battingLines.map(battingLine => ({
    ...battingLine,
    hits: battingLine.singles + battingLine.doubles + battingLine.triples + battingLine.homeruns,
    atBats: battingLine.plateAppearances - battingLine.walks - battingLine.sacFlies,
    teamId,
  }));

const buildLineScoreInputs = (
  runsPerInning: number[],
  teamRole: TeamRole
): ManualEntryLineScoreCellGameIdFkeyManualEntryLineScoreCellCreateInput[] =>
  runsPerInning.map((runs, index) => ({
    inning: index + 1,
    halfInning: teamRole === TeamRole.AWAY ? HalfInning.TOP : HalfInning.BOTTOM,
    runs,
  }));

export const buildGameInput = (
  groupId: string,
  gameInfo: GameInfoState,
  teamNames: TeamNamesState['names'],
  stats: StatsEntryState['stats'],
  runsPerInning: LineScoreEntryState['runsPerInning']
): GameInput => {
  const gameId = v4();
  const awayTeamId = v4();
  const homeTeamId = v4();

  const timeStarted = new Date(gameInfo.date);
  const timeEnded = new Date(
    gameInfo.date.substring(0, gameInfo.date.length - 5) + gameInfo.endTime
  );

  const awayScore = _.sum(runsPerInning.AWAY);
  const homeScore = _.sum(runsPerInning.HOME);

  return {
    id: gameId,
    groupId,
    name: gameInfo.name,
    soloMode: false,
    manualEntry: true,
    score: [awayScore, homeScore],
    timeStarted: formatISO(timeStarted),
    timeEnded: formatISO(timeEnded),
    teams: {
      create: [
        {
          name: teamNames.AWAY || 'Away Team',
          id: awayTeamId,
          role: TeamRole.AWAY,
          winner: awayScore > homeScore,
        },
        {
          name: teamNames.HOME || 'Home Team',
          id: homeTeamId,
          role: TeamRole.HOME,
          winner: homeScore > awayScore,
        },
      ],
    },
    lineups: {
      create: [
        buildLineupInput(stats.AWAY, gameId, awayTeamId),
        buildLineupInput(stats.HOME, gameId, homeTeamId),
      ],
    },
    manualEntryBattingLines: {
      create: [
        ...buildBattingLineInputs(stats.AWAY, awayTeamId),
        ...buildBattingLineInputs(stats.HOME, homeTeamId),
      ],
    },
    manualEntryLineScoreCells: {
      create: [
        ...buildLineScoreInputs(runsPerInning.AWAY, TeamRole.AWAY),
        ...buildLineScoreInputs(runsPerInning.HOME, TeamRole.HOME),
      ],
    },
  };
};
