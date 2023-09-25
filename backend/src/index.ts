/* eslint-disable import/order */
/* eslint-disable import/first */ // So that dotenv can be loaded before endpoints.
import "reflect-metadata";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

dotenv.config();

// Register endpoints

import { Model } from "shared";

import FirebaseConnector from "./FirebaseConnector";
import {
  onMatchUpdatedHandler,
  onMatchRequestHandler,
  onUserChangedUpdateGlobalRecommendationsHandler,
  reportMatchHandler,
} from "./matching";
import {
  changeMessageHandler,
  markRoomSeenHandler,
  reportRoomHandler,
} from "./messaging";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getPostsHandler } from "./posts";
import { bugReportHandler } from "./general";

// Initialize app

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });

export const getPosts = functions.https.onCall(getPostsHandler);
// export const doTwitterScheduled = functions.pubsub
//   .schedule("every 1 hours")
//   .onRun(doTwitterHandler);

// Set connector
Model.connector = new FirebaseConnector();
// Export endpoints
export const changeMessage = changeMessageHandler;
export const markRoomSeen = markRoomSeenHandler;
export const reportRoom = reportRoomHandler;
export const onMatchUpdated = onMatchUpdatedHandler;
export const onMatchRequest = onMatchRequestHandler;
export const onUserChangedUpdateGlobalRecommendations =
  onUserChangedUpdateGlobalRecommendationsHandler;
export const reportBug = bugReportHandler;
export const reportMatch = reportMatchHandler;
