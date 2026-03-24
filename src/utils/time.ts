export const isoToMs = (isoString: string): number => {
  return new Date(isoString).getTime();
};

export const msToIso = (ms: number): string => {
  return new Date(ms).toISOString();
};
