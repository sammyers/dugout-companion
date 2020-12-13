export const reorderItemInList = <T>(list: T[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export const moveItemBetweenLists = <T>(
  sourceList: T[],
  destList: T[],
  startIndex: number,
  endIndex: number
) => {
  const sourceClone = Array.from(sourceList);
  const destClone = Array.from(destList);
  const [removed] = sourceClone.splice(startIndex, 1);

  destClone.splice(endIndex, 0, removed);
  return [sourceClone, destClone];
};

export type SimplifyType<T, Keys extends string = ''> = T extends Array<any>
  ? Array<SimplifyType<NonNullable<T[number]>, Keys>>
  : T extends Record<string, any>
  ? {
      [K in Exclude<keyof T, '__typename'>]: K extends Keys
        ? SimplifyType<NonNullable<T[K]>, Keys>
        : SimplifyType<T[K], Keys>;
    }
  : T;
