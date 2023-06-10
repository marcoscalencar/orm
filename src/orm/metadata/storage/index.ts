import { GlobalTools } from "../../globalTools";
import { ColumnMetadataArgs } from "../column";
import { EntityMetadataArgs } from "../entity";

export class MetadataArgsStorage {
  readonly tables: EntityMetadataArgs[] = [];
  readonly columns: ColumnMetadataArgs[] = [];

  filterTables(
    target: (Function | string) | (Function | string)[]
  ): EntityMetadataArgs[] {
    return this.filterByTarget(this.tables, target);
  }

  filterColumns(target: Function | string): ColumnMetadataArgs[] {
    return this.filterByTarget(this.columns, target);
  }

  /**
   * Filters given array by a given target or targets.
   */
  protected filterByTarget<T extends { target: Function | string }>(
    array: T[],
    target: (Function | string) | (Function | string)[]
  ): T[] {
    return array.filter((table) => {
      return Array.isArray(target)
        ? target.indexOf(table.target) !== -1
        : table.target === target;
    });
  }
}

//Gets metada args storage
export function getMetadataArgsStorage(): MetadataArgsStorage {
  const globalScope = GlobalTools.getGlobalVariable();

  if (!globalScope.ormMetadataArgsStorage)
    globalScope.ormMetadataArgsStorage = new MetadataArgsStorage();

  return globalScope.ormMetadataArgsStorage;
}
