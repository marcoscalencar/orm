import { Entity } from "../entity";

// Define a generic repository interface that exposes methods for performing CRUD operations on entities using the query builder
export interface Repository<T extends Entity> {
  // Find all rows from the entity and return a promise that resolves to an array of rows
  findAll(): Promise<T["columns"][]>;

  // Find one row from the entity by its primary key and return a promise that resolves to the row or null if not found
  findById(id: any): Promise<T["columns"] | null>;

  // Find one row from the entity by a condition and return a promise that resolves to the row or null if not found
  findOne(
    condition: (t: T["columns"]) => boolean
  ): Promise<T["columns"] | null>;

  // Insert one or more rows into the entity and return a promise that resolves to the number of affected rows
  insert(...rows: Partial<T["columns"]>[]): Promise<any>;

  // Update one or more columns in the entity by a condition and return a promise that resolves to the number of affected rows
  update(
    columns: Partial<T["columns"]>,
    condition: (t: T["columns"]) => boolean
  ): Promise<any>;

  // Delete rows from the entity by a condition and return a promise that resolves to the number of affected rows
  delete(condition: (t: T["columns"]) => boolean): Promise<number>;
}
