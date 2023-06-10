import { BaseDataSourceOptions, DataSource } from "./orm/dataSource";
import { Column, Entity } from "./orm/decorators";

@Entity("users")
class User {
  constructor(data: any) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
  }
  @Column({ name: "id", type: "int" })
  id?: number;

  @Column({ name: "name", type: "varchar(255)" })
  name: string;

  @Column({ type: "varchar(255)", name: "email" })
  email: number;

  @Column({ type: "varchar(255)", name: "password" })
  password: number;
}

const connectionOptions: BaseDataSourceOptions = {
  database: "postgres",
  host: "localhost",
  password: "password",
  port: 5432,
  user: "root",
  name: "default",
  type: "postgres",
  entities: [User],
};

const dataSource = new DataSource(connectionOptions);
dataSource.initialize();
const repository = dataSource.getRepository(User);

repository
  .findAll()
  .then((users) => {
    console.log(users);
  })
  .catch((err) => {
    console.log(err);
  });
