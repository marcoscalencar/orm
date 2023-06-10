// Define a generic database entity interface
export interface Entity {
  // The name of the table that corresponds to this entity
  tableName?: string;

  // The columns of this entity as an object with column names as keys and column types as values
  columns: Record<string, any>;

  // The relations of this entity as an object with relation names as keys and relation types as values
  relations: Record<string, any>;
}
