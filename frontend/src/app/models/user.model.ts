export class User {
  _id!: string;
  name!: string; //Usuario o apodo pues
  email!: string;
  password!: string;
  status!: number;       // 0 = offline, 1 = online, etc.
  createdAt!: Date;      // fecha de registro
}

export class UserRegister {
  name!: string; //Usuario o apodo pues
  email!: string;
  password!: string;
  status!: number;       
  createdAt!: Date;
}