import * as functions from "firebase-functions";
import { Model, RoomReport } from "shared";

import Message from "../models/Message";
import Room from "../models/Room";
import User from "../models/User";
import NotificationBatch, { PushMessage } from "../util/Notifications";

export const changeMessageHandler = functions.firestore
  .document("rooms/{roomId}/messages/{messageId}")
  .onCreate(async (change, context) => {
    const message = Model.fromObject(change.data(), Message);
    await message.load();

    // Change last room
    const room = await Room.fromId(context.params.roomId);

    if (message == null) {
      room.lastMessage = undefined;
    } else {
      room.lastMessage = message;
    }

    await room.save();

    // Send push notification
    const batch = new NotificationBatch();

    const shortMsg = message.text.slice(0, 178);
    let pushMsg: PushMessage;

    if (room.isGroup()) {
      pushMsg = {
        title: `${message.user.profile.name} to ${room.getName()}`,

        body: shortMsg,
      };
    } else {
      // Loads the users in the room to get the name of the room
      await room.load();

      pushMsg = {
        title: `${message.user.profile.name} sent a message`,
        body: shortMsg,
      };
    }

    for (const uid of room.userIds) {
      if (uid === message.userId) continue;

      try {
        const privateData = await User.getPrivateDataFromUserId(uid);

        // Check if the user has muted the room
        if (privateData.mutedRooms[room.uid] != null) {
          continue;
        }

        await batch.addMessage(pushMsg, privateData);
      } catch (e) {
        console.error(e);
      }
    }

    await batch.send();
  });

export const markRoomSeenHandler = functions.https.onCall(
  async (data: { roomId: string; messageId: string }, context) => {
    const uid = context.auth?.uid;

    if (!uid) {
      return { status: 401, message: "User not authenticated" };
    }

    const { roomId } = data;

    const room = await Room.fromId(roomId);

    if (room == null) {
      return { status: 404, message: "Room not found." };
    }

    if (!room.userIds.includes(uid)) {
      return { status: 401, message: "User not in the room" };
    }

    const messages = await Model.getCollectionQuery(`rooms/${roomId}/messages`)
      .where("uid", "==", data.messageId)
      .limit(1)
      .get(Message);

    const message = messages[0];

    if (message == null) {
      return { status: 404, message: "Message not found." };
    }

    message.received = true;
    await message.save();
  },
);

/**
/* 
Stores a report for a room. The request should be sent with `roomId`, `authorUid`, `reportOption`, and `detail`.
*/
export const reportRoomHandler = functions.https.onCall(
  async (data, context) => {
    if (context.auth == null) {
      return { status: 401, message: "User not authenticated" };
    }

    const room = await Room.fromId(data.roomId);

    if (room == null) {
      return { status: 404, message: "Room not found." };
    }

    if (!room.userIds.includes(context.auth.uid)) {
      return { status: 403, message: "User not in the room" };
    }

    const report = new RoomReport();
    report.authorUid = context.auth.uid;
    report.detail = data.detail;
    report.reportOption = data.reportOption;
    report.roomUid = data.roomId;

    await report.saveInCollection("reports");
  },
);
