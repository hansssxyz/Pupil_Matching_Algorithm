import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export const bugReportHandler = functions.https.onCall(
  async (
    data: { version: string; phoneModel: string; os: string; detail: string },
    context,
  ) => {
    const uid = context.auth?.uid;

    if (!uid) {
      return { status: 401, message: "User not authenticated" };
    }

    await admin.firestore().collection("bugReports").add({
      userId: uid,
      version: data.version,
      phoneModel: data.phoneModel,
      os: data.os,
      detail: data.detail,
    });
  },
);
