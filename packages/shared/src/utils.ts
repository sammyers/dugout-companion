export type SimplifyType<T, Keys extends string = ''> = T extends Array<any>
  ? Array<SimplifyType<NonNullable<T[number]>, Keys>>
  : T extends Record<string, any>
  ? {
      [K in Exclude<keyof T, '__typename'>]: K extends Keys
        ? SimplifyType<NonNullable<T[K]>, Keys>
        : SimplifyType<T[K], Keys>;
    }
  : T;
