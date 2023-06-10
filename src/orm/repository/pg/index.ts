import { Repository } from "..";
import { Connection } from "../../connection";
import { Entity } from "../../entity";
import { PgQueryBuilder } from "../../queryBuilder/pg";

export class PgRepository<T extends Entity> implements Repository<T> {
  // The underlying connection object
  private connection: Connection;

  // The entity object
  private entity: T;

  // Create a new repository with the given connection and entity
  constructor(connection: Connection, entity: T) {
    this.connection = connection;
    this.entity = entity;
  }

  // Find all rows from the entity and return a promise that resolves to an array of rows
  async findAll(): Promise<T["columns"][]> {
    // Create a new query builder instance with the connection and entity
    let qb = new PgQueryBuilder(this.connection, this.entity);

    // Select all columns from the entity
    qb = qb.select(
      ...(Object.keys(this.entity.columns) as (keyof T["columns"])[])
    );

    // Execute the query and return the result
    return qb.execute();
  }

  // Find one row from the entity by its primary key and return a promise that resolves to the row or null if not found
  async findById(id: any): Promise<T["columns"] | null> {
    // Create a new query builder instance with the connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Select all columns from the entity
    qb.select(...(Object.keys(this.entity.columns) as (keyof T["columns"])[]));

    // Add a where clause to filter by the primary key column
    qb.where((t) => t.id === id);

    // Execute the query and get the result
    const result = await qb.execute();

    // Return the first row or null if not found
    return result[0] || null;
  }

  // Find one row from the entity by a condition and return a promise that resolves to the row or null if not found
  async findOne(
    condition: (t: T["columns"]) => boolean
  ): Promise<T["columns"] | null> {
    // Create a new query builder instance with the connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Select all columns from the entity
    qb.select(...(Object.keys(this.entity.columns) as (keyof T["columns"])[]));

    // Add a where clause to filter by the condition
    qb.where(condition);

    // Execute the query and get the result
    const result = await qb.execute();

    // Return the first row or null if not found
    return result[0] || null;
  }

  // Insert one or more rows into the entity and return a promise that resolves to the number of affected rows
  async insert(...rows: Partial<T["columns"]>[]): Promise<T["columns"][]> {
    // Create a new query builder instance with the connection and entity
    let qb = new PgQueryBuilder(this.connection, this.entity);

    // Insert the rows into the entity
    qb = qb.insert(...rows);

    // Execute the query and get the result
    const result = await qb.execute();

    // Return the number of affected rows from the result object
    return result;
  }

  // Update one or more columns in the entity by a condition and return a promise that resolves to the number of affected rows
  async update(
    columns: Partial<T["columns"]>,
    condition: (t: T["columns"]) => boolean
  ): Promise<T["columns"][]> {
    // Create a new query builder instance with the connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Update the columns in the entity
    qb.update(columns);

    // Add a where clause to filter by the condition
    qb.where(condition);

    // Execute the query and get the result
    const result = await qb.execute();

    // Return the number of affected rows from the result object
    return result;
  }

  // Delete rows from the entity by a condition and return a promise that resolves to the number of affected rows
  async delete(condition: (t: T["columns"]) => boolean): Promise<number> {
    // Create a new query builder instance with the connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Delete rows from the entity
    qb.delete();

    // Add a where clause to filter by the condition
    qb.where(condition);

    // Execute the query and get the result
    const result = await qb.execute();

    // Return the number of affected rows from the result object
    return (result as any).rowCount;
  }
}
