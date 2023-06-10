import { PgConnection } from "../connection/pg";

import { EntityMetadataArgs, EntityMetadataBuilder } from "../metadata/entity";
import { getMetadataArgsStorage } from "../metadata/storage";
import { Repository } from "../repository";
import { PgRepository } from "../repository/pg";

export type MixedList<T> = T[] | { [key: string]: T };

export class DataSource {
  readonly name: string;
  readonly type: string;
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
  readonly entitiesMetadatas: EntityMetadataArgs[];
  protected connection: any;
  constructor(options: BaseDataSourceOptions) {
    this.name = options.name;
    this.type = options.type;
    this.host = options.host;
    this.port = options.port;
    this.user = options.user;
    this.password = options.password;
    this.database = options.database;
    this.entitiesMetadatas = this.buildMetadatas(options.entities!);
  }

  mixedListToArray<T>(list: MixedList<T>): T[] {
    if (list !== null && typeof list === "object") {
      return Object.keys(list).map(
        (key) => (list as { [key: string]: T })[key]
      );
    } else {
      return list;
    }
  }

  initialize() {
    if (this.type === "postgres") {
      this.connection = new PgConnection(this);
    }
  }

  getRepository(target: any): Repository<any> {
    const test = this.entitiesMetadatas.find(
      (metadata) => metadata.target === target
    );
    const respoitory = new PgRepository<any>(this.connection, {
      columns: test?.columns?.reduce(
        (acc, curr) => ({ ...acc, [curr.propertyName]: curr.type }),
        {}
      ),

      tableName: test?.name,
    });

    return respoitory;
  }

  buildMetadatas(entities: MixedList<Function>) {
    const metadataArgsStorage = getMetadataArgsStorage();
    const allEntities = this.mixedListToArray(entities!);

    const entitiesMetadatas = new EntityMetadataBuilder(
      metadataArgsStorage
    ).build(allEntities);
    return entitiesMetadatas;
  }
}

export interface BaseDataSourceOptions {
  readonly name: string;
  readonly type: string;
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
  readonly entities?: MixedList<Function>;
}
