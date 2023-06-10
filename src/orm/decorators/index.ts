import { getMetadataArgsStorage } from "../metadata/storage";

export function Entity(name?: string) {
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

// function Column(options?: ColumnOptions) {
//   return function (object: any, propertyKey: string) {
//     console.log(propertyKey, this.name);
//     getMetadataArgsStorage().columns.push({
//       target: object.constructor,
//       propertyName: options?.name ?? propertyKey,
//       type:
//         options?.type ?? typeof object[propertyKey] == "string"
//           ? "varchar(255)"
//           : "int",
//     });
//   };
// }

export function Column(options?: ColumnOptions): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    getMetadataArgsStorage().columns.push({
      target: object.constructor,
      propertyName: options?.name ?? propertyName,
      type:
        options?.type ?? typeof (object as any)[propertyName] == "string"
          ? "varchar(255)"
          : "int",
    });
  };
}
