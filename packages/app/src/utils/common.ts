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
