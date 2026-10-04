export const queryKeys = {
  ranking: (configKey: string, page: number) =>
    ['ranking', configKey, page] as const,
}
