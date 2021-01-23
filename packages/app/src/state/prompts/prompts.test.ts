import { BaseType } from '@sammyers/dc-shared';

import { getAvailableBases, getRunnerOptions } from './prompts';

describe('getAvailableBases', () => {
  it('should return all bases in front if there is no lead runner', () => {
    expect(getAvailableBases(BaseType.FIRST, null)).toEqual([
      BaseType.SECOND,
      BaseType.THIRD,
      null,
    ]);
    expect(getAvailableBases(BaseType.SECOND, null)).toEqual([BaseType.THIRD, null]);
    expect(getAvailableBases(BaseType.THIRD, null)).toEqual([null]);
  });

  it('should return no bases if the lead runner is on the next base', () => {
    expect(getAvailableBases(BaseType.FIRST, BaseType.SECOND)).toEqual([]);
    expect(getAvailableBases(BaseType.SECOND, BaseType.THIRD)).toEqual([]);
  });

  it('should return the appropriate base in between', () => {
    expect(getAvailableBases(BaseType.FIRST, BaseType.THIRD)).toEqual([BaseType.SECOND]);
  });
});

describe('getRunnerOptions', () => {
  it('should return no options if there are no runners', () => {
    expect(getRunnerOptions({}, 1)).toBeUndefined();
  });

  it('should return one level of options if there is only one runner', () => {
    const runnerOptions = getRunnerOptions({ [BaseType.FIRST]: 'runner1' }, 1);
    expect(runnerOptions).toBeDefined();
    expect(runnerOptions!.getTrailingRunnerOptions).toBeUndefined();
  });

  it('should return no additional options if the next runner is blocked', () => {
    const runnerOptions = getRunnerOptions(
      { [BaseType.FIRST]: 'runner1', [BaseType.SECOND]: 'runner2' },
      1
    );
    expect(runnerOptions).toBeDefined();
    const { options, getTrailingRunnerOptions } = runnerOptions!;
    expect(getTrailingRunnerOptions).toBeDefined();
    expect(getTrailingRunnerOptions!(options[0])).toBeUndefined();
  });

  it('should return additional options if the trailing runner has an open base', () => {
    const runnerOptions = getRunnerOptions(
      { [BaseType.FIRST]: 'runner1', [BaseType.THIRD]: 'runner2' },
      1
    );
    expect(runnerOptions).toBeDefined();
    const { options, getTrailingRunnerOptions } = runnerOptions!;
    expect(getTrailingRunnerOptions!(options[1])).toBeDefined();
  });

  it('should keep returning options if all runners advance', () => {
    const { options, getTrailingRunnerOptions } = getRunnerOptions(
      {
        [BaseType.FIRST]: 'runner1',
        [BaseType.SECOND]: 'runner2',
        [BaseType.THIRD]: 'runner3',
      },
      1
    )!;
    expect(getTrailingRunnerOptions).toBeDefined();
    const nextOptions = getTrailingRunnerOptions!(options[1]);
    expect(nextOptions).toBeDefined();
    expect(nextOptions!.getTrailingRunnerOptions).toBeDefined();
    const nextNextOptions = nextOptions!.getTrailingRunnerOptions!(nextOptions!.options[1]);
    expect(nextNextOptions).toBeDefined();
  });
});
