import { getNewBase, mustRunnerAdvance } from './utils';

import { BaseType } from './types';

describe('getNewBase', () => {
  it('should score a runner from third base', () => {
    expect(getNewBase(BaseType.THIRD)).toBeNull();
    expect(getNewBase(BaseType.THIRD, 2)).toBeNull();
  });

  it('should advance a runner from second to third', () => {
    expect(getNewBase(BaseType.SECOND)).toBe(BaseType.THIRD);
  });

  it('should score a runner from second base', () => {
    expect(getNewBase(BaseType.SECOND, 2)).toBeNull();
  });

  it('should advance a runner from first to second', () => {
    expect(getNewBase(BaseType.FIRST)).toBe(BaseType.SECOND);
  });

  it('should advance a runner from first to third', () => {
    expect(getNewBase(BaseType.FIRST, 2)).toBe(BaseType.THIRD);
  });

  it('should score a runner from first base', () => {
    expect(getNewBase(BaseType.FIRST, 3)).toBeNull();
  });
});

describe('mustRunnerAdvance', () => {
  it('should not require a runner on third to advance', () => {
    const runners = {
      [BaseType.THIRD]: 'runner1',
    };
    expect(mustRunnerAdvance(BaseType.THIRD, runners)).toBe(false);
  });

  it('should not require a runner on second to advance', () => {
    const runners = {
      [BaseType.SECOND]: 'runner1',
    };
    expect(mustRunnerAdvance(BaseType.SECOND, runners)).toBe(false);
  });

  it('should require no one to advance with runners on second and third', () => {
    const runners = {
      [BaseType.THIRD]: 'runner1',
      [BaseType.SECOND]: 'runner2',
    };
    expect(mustRunnerAdvance(BaseType.THIRD, runners)).toBe(false);
    expect(mustRunnerAdvance(BaseType.SECOND, runners)).toBe(false);
  });

  it('should require both runners to advance on first and second', () => {
    const runners = {
      [BaseType.SECOND]: 'runner1',
      [BaseType.FIRST]: 'runner2',
    };
    expect(mustRunnerAdvance(BaseType.SECOND, runners)).toBe(true);
    expect(mustRunnerAdvance(BaseType.FIRST, runners)).toBe(true);
  });

  it('should require all runners to advance with the bases loaded', () => {
    const runners = {
      [BaseType.THIRD]: 'runner1',
      [BaseType.SECOND]: 'runner2',
      [BaseType.FIRST]: 'runner3',
    };
    expect(mustRunnerAdvance(BaseType.THIRD, runners)).toBe(true);
    expect(mustRunnerAdvance(BaseType.SECOND, runners)).toBe(true);
    expect(mustRunnerAdvance(BaseType.FIRST, runners)).toBe(true);
  });
});
