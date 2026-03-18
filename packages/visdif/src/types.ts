export interface VisDifModule {
  VisDiff: new (
    data: string,
    width: number,
    height: number
  ) => { distance: (other: string) => number };
  intArrayToString?: (arr: number[]) => string;
}
