import { getNewBase } from './utils';

import { BaseType } from './types';

describe('getNewBase', () => {
  it('should score a runner from third base', () => {
    expect(getNewBase(BaseType.THIRD)).toBe(null);
    expect(getNewBase(BaseType.THIRD, 2)).toBe(null);
  });

  it('should advance a runner from second to third', () => {
    expect(getNewBase(BaseType.SECOND)).toBe(BaseType.THIRD);
  });

  it('should score a runner from second base', () => {
    expect(getNewBase(BaseType.SECOND, 2)).toBe(null);
  });

  it('should advance a runner from first to second', () => {
    expect(getNewBase(BaseType.FIRST)).toBe(BaseType.SECOND);
  });

  it('should advance a runner from first to third', () => {
    expect(getNewBase(BaseType.FIRST, 2)).toBe(BaseType.THIRD);
  });

  it('should score a runner from first base', () => {
    expect(getNewBase(BaseType.FIRST, 3)).toBe(null);
  });
});
