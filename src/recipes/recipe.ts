export interface Recipe {
  id: string;
  displayName: string;
  cook: (source: string) => string;
}
