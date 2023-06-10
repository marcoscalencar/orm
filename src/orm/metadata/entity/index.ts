import { ColumnMetadataArgs } from "../column";
import { MetadataArgsStorage } from "../storage";

/**
 * Arguments for TableMetadata class, helps to construct an TableMetadata object.
 */
export interface EntityMetadataArgs {
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

  // /**
  //  * Table's database engine type (like "InnoDB", "MyISAM", etc).
  //  */
  // engine?: string;

  // /**
  //  * Database name. Used in MySql and Sql Server.
  //  */
  // database?: string;

  // /**
  //  * Schema name. Used in Postgres and Sql Server.
  //  */
  // schema?: string;

  // /**
  //  * Indicates if schema synchronization is enabled or disabled for this entity.
  //  * If it will be set to false then schema sync will and migrations ignore this entity.
  //  * By default schema synchronization is enabled for all entities.
  //  */
  // synchronize?: boolean;

  // /**
  //  * View dependencies.
  //  */
  // dependsOn?: Set<Function | string>;

  // /**
  //  * Indicates if view is materialized
  //  */
  // materialized?: boolean;

  // /**
  //  * If set to 'true' this option disables Sqlite's default behaviour of secretly creating
  //  * an integer primary key column named 'rowid' on table creation.
  //  */
  // withoutRowid?: boolean;

  columns?: ColumnMetadataArgs[];
}

export class EntityMetadataBuilder {
  constructor(private metadataArgsStorage: MetadataArgsStorage) {}
  build(entityClasses?: Function[]) {
    const allTables = entityClasses
      ? this.metadataArgsStorage.filterTables(entityClasses)
      : this.metadataArgsStorage.tables;
    return allTables.map((tableArgs) => {
      return {
        ...tableArgs,
        columns: this.metadataArgsStorage.filterColumns(tableArgs.target),
      };
    });
  }
}
