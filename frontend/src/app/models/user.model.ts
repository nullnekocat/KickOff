export class User {
  _id!: string;
  name!: string;
  email!: string;
  password!: string;
  status!: number;       // 0 = offline, 1 = online, etc.
  createdAt!: Date;      // fecha de registro
}
