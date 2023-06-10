export interface Connection {
  // Execute a raw SQL query and return the result
  query(sql: string, params?: any[]): Promise<any>;

  // Begin a transaction and return a transaction object
  beginTransaction(): Promise<Transaction>;

  // Close the connection
  close(): Promise<void>;
}

// Define a generic transaction interface that extends the connection interface
export interface Transaction extends Connection {
  // Commit the transaction
  commit(): Promise<void>;

  // Rollback the transaction
  rollback(): Promise<void>;
}
export interface ClientOptions {
  database: string;
  host: string;
  password: string;
  port: number;
  user: string;
}
