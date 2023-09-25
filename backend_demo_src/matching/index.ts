import { plainToInstance } from "class-transformer";
import * as functions from "firebase-functions";
import {
  GlobalRecommendations,
  InterestType,
  MatchReport,
  Model,
  RoomSchema,
  UserMatchingData,
} from "shared";
import { v4 as uuidv4 } from "uuid";

import Message from "../models/Message";
import User from "../models/User";
import NotificationBatch from "../util/Notifications";

/**
 * Creates a direct message room between two newly matched users.
 * @param userId1 The first user's ID.
 * @param userId2 The second user's ID.
 */
async function createMatchedRoomDm(userId1: string, userId2: string) {
  // Create new DM for the matched users
  const room = new RoomSchema();
  room.userIdsInRoom = { [userId1]: true, [userId2]: true };
  room.type = "direct";
  await room.saveInCollection("rooms");

  // Send the first message in the room
  const startMessage = new Message();
  startMessage.sent = true;
  startMessage.userId = userId1;
  startMessage.text = "Hi! Thanks for matching with me.";
  startMessage.uid = uuidv4();
  await startMessage.saveInCollection(`rooms/${room.uid}/messages`);
}

async function getDmRoom(
  userId1: string,
  userId2: string,
): Promise<RoomSchema | undefined> {
  const query = await RoomSchema.getCollectionQuery("rooms")
    .where("type", "==", "direct")
    .where(`userIdsInRoom.${userId1}`, "==", true)
    .where(`userIdsInRoom.${userId2}`, "==", true)
    .get(RoomSchema);

  return query.at(0);
}

/**
 * Notifies the mentee that their match request was accepted.
 * @param mentor The mentor that accepted the match request.
 * @param mentee The mentee that sent the match request.
 */
async function sendMatchAcceptNotification(mentor: User, mentee: User) {
  const batch = new NotificationBatch();

  await batch.addMessage(
    {
      title: "Match acccepted",
      body: `${mentor.profile.name} accepted your match request.`,
    },
    await mentee.getPrivateData(),
  );

  await batch.send();
}

/**
 * Sends a push notification to the user that they have a new match request.
 * @param fromUser The user that sent the match request.
 * @param toUser The user that received the match request.
 */
async function sendMatchRequestNotification(fromUser: User, toUser: User) {
  const batch = new NotificationBatch();

  await batch.addMessage(
    {
      title: "New match request",
      body: `${fromUser.profile.name} sent you a match request.`,
    },
    await toUser.getPrivateData(),
  );

  console.log("Sending match request notification to", toUser.uid);

  await batch.send();
}

/**
 * Compares the before and after states of the user's match requests and returns the inserted newly matched user.
 * @param beforeRequests The before state of the user's match requests.
 * @param afterRequests The after state of the user's match requests.
 * @returns The newly matched user, or undefined if no new match was found.
 */
function findNewlyMatchedUser(
  beforeRequests: { [uid: string]: any },
  afterRequests: { [uid: string]: any },
): Promise<User> | undefined {
  if (beforeRequests == null) {
    return User.fromId(Object.keys(afterRequests)[0]);
  }
  const before = Object.keys(beforeRequests);
  const after = Object.keys(afterRequests);

  const matched = after.filter((uid) => !before.includes(uid));

  if (matched.length === 0) {
    return undefined;
  }

  return User.fromId(matched[0]);
}

export const onMatchUpdatedHandler = functions.firestore
  .document("matches/{userId}")
  .onWrite(async (change, context) => {
    // Only create if the user is a mentor
    const mentor = await User.fromId(context.params.userId);

    if (mentor.roles.mentee) {
      return;
    }

    // Get the before and after requests
    const beforeRequests = Model.fromObject(
      change.before.data(),
      UserMatchingData,
    );
    const afterRequests = Model.fromObject(
      change.after.data(),
      UserMatchingData,
    );

    const mentee = await findNewlyMatchedUser(
      beforeRequests.matched,
      afterRequests.matched,
    );

    if (mentee == null) {
      return;
    }

    // Check if there is already a room between the two users
    const dmRoom = await getDmRoom(mentee.uid, mentor.uid);

    if (dmRoom != null) {
      if (!dmRoom.isArchived) {
        throw new Error("Room already exists between users");
      }

      dmRoom.isArchived = false;
      await dmRoom.save();
    } else {
      await createMatchedRoomDm(context.params.userId, mentee.uid);
    }

    await sendMatchAcceptNotification(mentor, mentee);
  });

export const onMatchRequestHandler = functions.firestore
  .document("matches/{userId}")
  .onWrite(async (change, context) => {
    const beforeRequests = Model.fromObject(
      change.before.data(),
      UserMatchingData,
    );
    const afterRequests = Model.fromObject(
      change.after.data(),
      UserMatchingData,
    );

    const fromUser = await findNewlyMatchedUser(
      beforeRequests.matchRequests,
      afterRequests.matchRequests,
    );

    if (fromUser == null) {
      return;
    }

    const toUser = await User.fromId(context.params.userId);

    await sendMatchRequestNotification(fromUser, toUser);
  });

// Updates the global recommendations when a user's interests are changed
export const onUserChangedUpdateGlobalRecommendationsHandler =
  functions.firestore
    .document("users/{userId}")
    .onWrite(async (_change, context) => {
      const user = await User.fromId(context.params.userId);

      // Only update for mentors
      if (user.roles.mentee) {
        return;
      }

      const globalRecommendations = await GlobalRecommendations.get();
      const userInRec = plainToInstance(
        InterestType,
        globalRecommendations.data[context.params.userId],
      );

      // No update needed if data is not changed
      if (
        user.experiences.interests.isBlank() ||
        userInRec?.isEqualTo(user.experiences.interests)
      ) {
        return;
      }

      globalRecommendations.data[context.params.userId] =
        user.experiences.interests;

      await globalRecommendations.save();
    });

/**
 * Stores a report in the database.
 */
export const reportMatchHandler = functions.https.onCall(
  async (data, context) => {
    if (context.auth == null) {
      return { status: 401, message: "User not authenticated" };
    }

    const report = new MatchReport();
    report.detail = data.detail;
    report.authorUid = context.auth.uid;
    report.matchUid = data.matchUid;
    report.reportOption = data.reportOption;

    await report.saveInCollection("reports");
  },
);
