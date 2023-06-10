import * as pg from "pg";

// Define a generic database connection interface
interface Connection {
  // Execute a raw SQL query and return the result
  query(sql: string, params?: any[]): Promise<any>;

  // Begin a transaction and return a transaction object
  beginTransaction(): Promise<Transaction>;

  // Close the connection
  close(): Promise<void>;
}

interface ClientOptions {
  database: string;
  host: string;
  password: string;
  port: number;
  user: string;
}

// Define a PGSQL connection class that implements the generic connection interface
class PgConnection implements Connection {
  // The underlying PGSQL client object
  private client: any;

  // Create a new connection with the given options
  constructor(options: ClientOptions) {
    // Use some PGSQL driver or client library to create the client object
    this.client = new pg.Client(options);
  }

  // Execute a raw SQL query and return the result
  async query(sql: string, params?: any[]): Promise<any> {
    try {
      await this.client.connect();
      // Use the client object to execute the query with the given parameters
      const result = await this.client.query(sql, params);
      // Return the result object
      return result;
    } catch (error) {
      // Handle any errors that may occur
      throw error;
    }
  }

  // Begin a transaction and return a transaction object
  async beginTransaction(): Promise<Transaction> {
    try {
      // Use the client object to begin a transaction
      await this.client.query("BEGIN");
      // Return a new transaction object that wraps this connection
      return new PgTransaction(this);
    } catch (error) {
      // Handle any errors that may occur
      throw error;
    }
  }

  // Close the connection
  async close(): Promise<void> {
    try {
      // Use the client object to close the connection
      await this.client.end();
    } catch (error) {
      // Handle any errors that may occur
      throw error;
    }
  }
}

// Define a generic transaction interface that extends the connection interface
interface Transaction extends Connection {
  // Commit the transaction
  commit(): Promise<void>;

  // Rollback the transaction
  rollback(): Promise<void>;
}

// Define a PGSQL transaction class that implements the generic transaction interface
class PgTransaction implements Transaction {
  // The underlying connection object
  private connection: PgConnection;

  // Create a new transaction with the given connection
  constructor(connection: PgConnection) {
    this.connection = connection;
  }
  // Execute a raw SQL query and return the result
  async query(sql: string, params?: any[]): Promise<any> {
    // Delegate the query execution to the connection object
    return this.connection.query(sql, params);
  }

  // Begin a transaction and return a transaction object
  async beginTransaction(): Promise<Transaction> {
    // Throw an error if trying to begin a nested transaction
    throw new Error("Cannot begin a nested transaction");
  }

  // Commit the transaction
  async commit(): Promise<void> {
    try {
      // Use the connection object to commit the transaction
      await this.connection.query("COMMIT");
    } catch (error) {
      // Handle any errors that may occur
      throw error;
    }
  }

  // Rollback the transaction
  async rollback(): Promise<void> {
    try {
      // Use the connection object to rollback the transaction
      await this.connection.query("ROLLBACK");
    } catch (error) {
      // Handle any errors that may occur
      throw error;
    }
  }

  // Close the connection
  async close(): Promise<void> {
    // Throw an error if trying to close a transaction
    throw new Error("Cannot close a transaction");
  }
}

function entity(name?: string) {
  return function (target: Function) {
    getMetadataArgsStorage().tables.push({
      target: target,
      name: name,
      type: "regular",
    });
  };
}

export interface ColumnOptions {
  name?: string;
  type?: string;
}

function column(options?: ColumnOptions) {
  return function (target: any, propertyName: string) {
    getMetadataArgsStorage().columns.push({
      target: target.constructor,
      propertyName: options?.name ?? propertyName,
      type:
        options?.type ?? typeof target[propertyName] == "string"
          ? "varchar(255)"
          : "int",
    });
  };
}

// Define a generic database entity interface
interface Entity {
  // The name of the table that corresponds to this entity
  tableName?: string;

  // The columns of this entity as an object with column names as keys and column types as values
  columns: Record<string, any>;

  // The relations of this entity as an object with relation names as keys and relation types as values
  relations: Record<string, any>;
}

// Define a user entity class that implements the generic entity interface

// Define a generic query builder interface that exposes methods for building SQL queries with a fluent and type-safe syntax
interface QueryBuilder<T extends Entity> {
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

// Define a PGSQL query builder class that implements the generic query builder interface
class PgQueryBuilder<T extends Entity> implements QueryBuilder<T> {
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

// Define a generic repository interface that exposes methods for performing CRUD operations on entities using the query builder
interface Repository<T extends Entity> {
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

class PgRepository<T extends Entity> implements Repository<T> {
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
/**
 * Arguments for TableMetadata class, helps to construct an TableMetadata object.
 */
export interface TableMetadataArgs {
  /**
   * Class to which table is applied.
   * Function target is a table defined in the class.
   * String target is a table defined in a json schema.
   */
  target: Function | string;

  /**
   * Table's name. If name is not set then table's name will be generated from target's name.
   */
  name?: string;

  /**
   * Table type. Tables can be abstract, closure, junction, embedded, etc.
   */
  type: "regular";

  /**
   * Table's database engine type (like "InnoDB", "MyISAM", etc).
   */
  engine?: string;

  /**
   * Database name. Used in MySql and Sql Server.
   */
  database?: string;

  /**
   * Schema name. Used in Postgres and Sql Server.
   */
  schema?: string;

  /**
   * Indicates if schema synchronization is enabled or disabled for this entity.
   * If it will be set to false then schema sync will and migrations ignore this entity.
   * By default schema synchronization is enabled for all entities.
   */
  synchronize?: boolean;

  /**
   * View dependencies.
   */
  dependsOn?: Set<Function | string>;

  /**
   * Indicates if view is materialized
   */
  materialized?: boolean;

  /**
   * If set to 'true' this option disables Sqlite's default behaviour of secretly creating
   * an integer primary key column named 'rowid' on table creation.
   */
  withoutRowid?: boolean;
}

export interface ColumnMetadataArgs {
  /**
   * Class to which column is applied.
   */
  readonly target: Function | string;

  /**
   * Class's property name to which column is applied.
   */
  readonly propertyName: string;

  // /**
  //  * Column mode in which column will work.
  //  *
  //  * todo: find name better then "mode".
  //  */
  // readonly mode: ColumnMode

  readonly type: string;

  // /**
  //  * Extra column options.
  //  */
  // readonly options: ColumnOptions
}

class BaseEntity implements Entity {
  constructor() {}
  tableName?: string | undefined;
  columns: Record<string, any> = {};
  relations: Record<string, any> = {};
}

@entity("users")
class User extends BaseEntity {
  constructor() {
    super();
  }
  columns = {
    id: "int",
    name: "string",
    email: "string",
    password: "string",
  };
  relations = {
    posts: "hasMany(Post)",
  };
}

@entity("comments")
export class Comment {
  @column({ type: "int", name: "id" })
  id?: number;

  @column({ type: "string", name: "content" })
  content?: string;

  @column({ type: "int", name: "postId" })
  postId?: number;
}

// @entity()
// class Post extends BaseEntity {
//   constructor() {
//     super();
//   }
//   columns = {
//     id: "int",
//     title: "string",
//     content: "string",
//     authorId: "int",
//   };
//   relations = {
//     author: "belongsTo(User)",
//     comments: "hasMany(Comment)",
//   };
// }

export class GlobalTools {
  static getGlobalVariable(): any {
    return global;
  }
}

//Define storage of all metadatas args of all available types tables, columns
export class MetadataArgsStorage {
  readonly tables: TableMetadataArgs[] = [];
  readonly columns: ColumnMetadataArgs[] = [];
}

//Gets metada args storage
export function getMetadataArgsStorage(): MetadataArgsStorage {
  const globalScope = GlobalTools.getGlobalVariable();
  if (!globalScope.ormMetadataArgsStorage)
    globalScope.ormMetadataArgsStorage = new MetadataArgsStorage();

  return globalScope.typeormMetadataArgsStorage;
}

// Create a connection to the database using some PGSQL driver or client library
const connection = new PgConnection({
  database: "postgres",
  host: "localhost",
  password: "password",
  port: 5432,
  user: "root",
});

// Create a repository for each entity type using the connection and the entity class
const userRepository = new PgRepository(connection, new User());
// const postRepository = new PgRepository(connection, new Post());
userRepository;
// Use the repositories to perform CRUD operations on entities using async/await syntax
async function main() {
  // Insert a new user into the database
  // await userRepository.insert({
  //   name: "Pixel",
  //   email: "Pixel@example.com",
  //   password: "gatinha lindinha",
  // });

  // const users = await userRepository.findAll();
  const queryBuilder = new PgQueryBuilder(connection, new User());
  const users = await queryBuilder
    .select("id", "name", "password")
    // .where((user) => user.name == "marcos")
    .orderBy("name", "desc")
    .limit(2)
    .execute();

  console.log({ users });
  // const post = await postRepository.insert({
  //   title: "Hello world",
  //   content: "This is my first post",
  //   authorId: user[0].id,
  // });

  // Find all posts with their authors using a query builder

  // Update the user's name by a condition using a repository
  //   await userRepository.update(
  //     { name: "Bob" },
  //     (u) => u.email === "alice@example.com"
  //   );

  //   // Delete the post by its id using a repository
  //   await postRepository.delete((p) => p.id === post[0].id);

  //   // Close the connection
  await connection.close();

  //   const queryBuilder = new PgQueryBuilder(connection, new Post());

  //   queryBuilder.innerJoin(new User(), (t) => t.authorId === t.id);

  //   queryBuilder.where((t) => t.id === "1");
  //   queryBuilder.limit(10);
  //   queryBuilder.offset(10);
  //   queryBuilder.orderBy("title", "desc");
  //   const result = queryBuilder.execute();
}

// Run the main function
main().catch(async (error) => {
  await connection.close();
  console.error(error);
});

// Insert a new post into the database

// Define a PGSQL repository class that implements the generic repository interface
// class PgRepository<T extends Entity> implements Repository<T> {
