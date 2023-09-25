import { Exclude } from "class-transformer";
import { MessageSchema } from "shared/dist/src/Message";

import User from "./User";

export default class Message extends MessageSchema {
  @Exclude()
  user: User;
  /**
   * Loads the data for the room
   */
  async load() {
    this.user = await User.fromId(this.userId);
  }
}
