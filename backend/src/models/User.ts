import { UserSchema } from "shared";

export default class User extends UserSchema {
  static async fromId(id: string): Promise<User> {
    return User.fromRef(`users/${id}`, User);
  }
}
