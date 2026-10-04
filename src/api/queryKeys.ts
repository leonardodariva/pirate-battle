export const queryKeys = {
  ranking: (configKey: string, page: number) =>
    ['ranking', configKey, page] as const,
  history: (playerId: string, page: number) =>
    ['history', playerId, page] as const,
}
