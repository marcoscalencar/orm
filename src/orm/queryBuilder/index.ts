import { Entity } from "../entity";

// Define a generic query builder interface that exposes methods for building SQL queries with a fluent and type-safe syntax
export interface QueryBuilder<T extends Entity> {
  // Select one or more columns from the entity and return a new query builder instance with the selected columns
  select(...columns: (keyof T["columns"])[]): QueryBuilder<T>;

  // Insert one or more rows into the entity and return a new query builder instance with the inserted rows
  insert(...rows: Partial<T["columns"]>[]): QueryBuilder<T>;

  // Update one or more columns in the entity and return a new query builder instance with the updated columns
  update(columns: Partial<T["columns"]>): QueryBuilder<T>;

  // Delete rows from the entity and return a new query builder instance with no columns
  delete(): QueryBuilder<T>;

  // Join another entity with this entity using an inner join and return a new query builder instance with both entities' columns
  innerJoin<U extends Entity>(
    entity: U,
    on: (t: T["columns"], u: U["columns"]) => boolean
  ): QueryBuilder<T & U>; // Join another entity with this entity using a left join and return a new query builder instance with both entities' columns
  leftJoin<U extends Entity>(
    entity: U,
    on: (t: T["columns"], u: U["columns"]) => boolean
  ): QueryBuilder<T & U>;

  // Add a where clause to the query and return a new query builder instance with the same columns
  where(condition: (t: T["columns"]) => boolean): QueryBuilder<T>;

  // Add an order by clause to the query and return a new query builder instance with the same columns
  orderBy(
    column: keyof T["columns"],
    direction: "asc" | "desc"
  ): QueryBuilder<T>;

  // Add a limit clause to the query and return a new query builder instance with the same columns
  limit(count: number): QueryBuilder<T>;

  // Add an offset clause to the query and return a new query builder instance with the same columns
  offset(count: number): QueryBuilder<T>;

  // Execute the query and return a promise that resolves to an array of rows
  execute(): Promise<T["columns"][]>;
}
