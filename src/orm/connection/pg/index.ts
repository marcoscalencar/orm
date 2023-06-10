import * as pg from "pg";
import { ClientOptions, Connection, Transaction } from "..";
// Define a PGSQL connection class that implements the generic connection interface
export class PgConnection implements Connection {
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
