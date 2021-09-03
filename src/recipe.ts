export interface RecipeElementConfiguration {
  id: string;
  options: object;
}

export interface Recipe {
  ingester: RecipeElementConfiguration;
  preparations: RecipeElementConfiguration[];
}
