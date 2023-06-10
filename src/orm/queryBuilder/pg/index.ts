import { QueryBuilder } from "..";
import { Connection } from "../../connection";
import { Entity } from "../../entity";

// Define a PGSQL query builder class that implements the generic query builder interface
export class PgQueryBuilder<T extends Entity> implements QueryBuilder<T> {
  // The underlying connection object
  private connection: Connection;

  // The entity object
  private entity: T;

  // The SQL query string
  private sql: string;

  // The SQL query parameters
  private params: any[];

  // Create a new query builder with the given connection and entity
  constructor(connection: Connection, entity: T) {
    this.connection = connection;
    this.entity = entity;
    this.sql = "";
    this.params = [];
  }

  // Select one or more columns from the entity and return a new query builder instance with the selected columns
  select(...columns: (keyof T["columns"])[]) {
    // Create a new query builder instance with the same connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Build the SQL query string for selecting columns
    qb.sql = `SELECT ${columns
      .map((column) => `"${String(column)}"`)
      .join(", ")} FROM "${this.entity.tableName}"`;
    // Return the new query builder instance
    return qb;
  }

  // Insert one or more rows into the entity and return a new query builder instance with the inserted rows
  insert(...rows: Partial<T["columns"]>[]) {
    // Create a new query builder instance with the same connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Get the column names from the first row
    const columns = Object.keys(rows[0]) as (keyof T["columns"])[]; // Build the SQL query string for inserting rows
    qb.sql = `INSERT INTO "${this.entity.tableName}" (${columns
      .map((column) => `"${String(column)}"`)
      .join(", ")}) VALUES`;
    // Loop through the rows and add the values and parameters to the query
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const values = columns.map((column) => {
        // Get the value for the column
        const value = row[column];

        // If the value is undefined, use NULL
        if (value === undefined) {
          return "NULL";
        }

        // Otherwise, add a parameter placeholder and push the value to the parameters array
        qb.params.push(value);
        return `$${qb.params.length}`;
      });

      // Add the values to the query string
      qb.sql += `(${values.join(", ")})`;

      // Add a comma separator if this is not the last row
      if (i < rows.length - 1) {
        qb.sql += ", ";
      }
    }

    // Return the new query builder instance
    return qb;
  }

  // Update one or more columns in the entity and return a new query builder instance with the updated columns
  // Update one or more columns in the entity and return a new query builder instance with the updated columns
  update(columns: Partial<T["columns"]>): QueryBuilder<T> {
    // Create a new query builder instance with the same connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Build the SQL query string for updating columns
    qb.sql = `UPDATE "${this.entity.tableName}" SET`;

    // Loop through the columns and add the assignments and parameters to the query
    const keys = Object.keys(columns) as (keyof T["columns"])[];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = columns[key];

      // Add the column name to the query string
      qb.sql += ` "${String(key)}" =`;

      // If the value is undefined, use NULL
      if (value === undefined) {
        qb.sql += " NULL";
      } else {
        // Otherwise, add a parameter placeholder and push the value to the parameters array
        qb.params.push(value);
        qb.sql += ` $${qb.params.length}`;
      }

      // Add a comma separator if this is not the last column
      if (i < keys.length - 1) {
        qb.sql += ", ";
      }
    }

    // Return the new query builder instance
    return qb;
  }

  // Delete rows from the entity and return a new query builder instance with no columns
  delete(): QueryBuilder<T> {
    // Create a new query builder instance with the same connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Build the SQL query string for deleting rows
    qb.sql = `DELETE FROM "${this.entity.tableName}"`;

    // Return the new query builder instance
    return qb;
  }

  // Join another entity with this entity using an inner join and return a new query builder instance with both entities' columns
  innerJoin<U extends Entity>(
    entity: U,
    on: (t: T["columns"], u: U["columns"]) => boolean
  ): QueryBuilder<T & U> {
    // Create a new query builder instance with the same connection and a merged entity
    const qb = new PgQueryBuilder(this.connection, {
      ...this.entity,
      ...entity,
    } as T & U);

    // Build the SQL query string for joining another entity
    qb.sql = `SELECT * FROM "${this.entity.tableName}" INNER JOIN "${entity.tableName}" ON`;

    // Convert the on function to a string representation of the join condition
    const condition = on
      .toString()
      .replace(/t\./g, `"${this.entity.tableName}".`)
      .replace(/u\./g, `"${entity.tableName}".`);

    // Add the condition to the query string
    qb.sql += condition;

    // Return the new query builder instance
    return qb;
  }

  // Join another entity with this entity using a left join and return a new query builder instance with both entities' columns
  leftJoin<U extends Entity>(
    entity: U,
    on: (t: T["columns"], u: U["columns"]) => boolean
  ): QueryBuilder<T & U> {
    // Create a new query builder instance with the same connection and a merged entity
    const qb = new PgQueryBuilder(this.connection, {
      ...this.entity,
      ...entity,
    } as T & U);

    // Build the SQL query string for joining another entity
    qb.sql = `SELECT * FROM "${this.entity.tableName}" LEFT JOIN "${entity.tableName}" ON`;

    // Convert the on function to a string representation of the join condition
    const condition = on
      .toString()
      .replace(/t\./g, `"${this.entity.tableName}".`)
      .replace(/u\./g, `"${entity.tableName}".`);

    // Add the condition to the query string
    qb.sql += condition;

    // Return the new query builder instance
    return qb;
  }

  // Add a where clause to the query and return a new query builder instance with the same columns
  where(condition1: (t: T["columns"]) => boolean): QueryBuilder<T> {
    // Create a new query builder instance with the same connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Build the SQL query string for adding a where clause
    qb.sql = `${this.sql} WHERE`;

    // Convert the condition function to a string representation of the where condition
    const condition = condition1
      .toString()
      .replace(/t\./g, `"${this.entity.tableName}".`);

    // Add the condition to the query string
    qb.sql += condition;
    console.log({ where: qb });
    // Return the new query builder instance
    return qb;
  }

  // Add an order by clause to the query and return a new query builder instance with the same columns
  orderBy(
    column: keyof T["columns"],
    direction: "asc" | "desc"
  ): QueryBuilder<T> {
    // Create a new query builder instance with the same connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Build the SQL query string for adding an order by clause
    qb.sql = `${this.sql} ORDER BY "${String(
      column
    )}" ${direction.toUpperCase()}`;

    // Return the new query builder instance
    return qb;
  }

  // Add a limit clause to the query and return a new query builder instance with the same columns
  limit(count: number): QueryBuilder<T> {
    // Create a new query builder instance with the same connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Build the SQL query string for adding a limit clause
    qb.sql = `${this.sql} LIMIT ${count}`;

    // Return the new query builder instance
    return qb;
  }

  // Add an offset clause to the query and return a new query builder instance with the same columns
  offset(count: number): QueryBuilder<T> {
    // Create a new query builder instance with the same connection and entity
    const qb = new PgQueryBuilder(this.connection, this.entity);

    // Build the SQL query string for adding an offset clause
    qb.sql = `${this.sql} OFFSET ${count}`;

    // Return the new query builder instance
    return qb;
  }

  // Execute the query and return a promise that resolves to an array of rows
  async execute(): Promise<T["columns"][]> {
    try {
      // Use the connection object to execute the query and get the result
      const result = await this.connection.query(this.sql, this.params);
      // Return the rows array from the result object
      return result.rows;
    } catch (error) {
      // Handle any errors that may occur
      throw error;
    }
  }
}
