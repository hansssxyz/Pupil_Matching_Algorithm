import { Type } from "class-transformer";
import { RoomSchema } from "shared";

import Message from "./Message";

export default class Room extends RoomSchema {
  @Type(() => Message)
  lastMessage?: Message;

  static async fromId(id: string): Promise<Room> {
    return Room.fromRef(`rooms/${id}`, Room);
  }
}
