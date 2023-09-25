import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import "reflect-metadata";
import {
  InstitutionSchema,
  SocialMediaUpdateSchema,
  transformFirestoreTypes,
} from "shared";
import { TwitterApi } from "twitter-api-v2";

import { PostProvider, TwitterPostProvider } from "./PostProvider";

const PROVIDERS_TO_FETCH: PostProvider[] = [];

// SETUP PROVIDERS
if (process.env.TWITTER_API_KEY != null) {
  const twiterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY!,
    appSecret: process.env.TWITTER_APP_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  }).readOnly;

  PROVIDERS_TO_FETCH.push(new TwitterPostProvider(twiterClient));
}

/**
 * Selects a random document from a collection.
 * @param collection
 * @returns The document .
 */
/*
async function selectRandomDocument(
  collection: FirebaseFirestore.CollectionReference
): Promise<FirebaseFirestore.DocumentSnapshot> {
  const randomDocId = collection.doc().id;

  const search = collection.limit(1).orderBy("uid");

  let searchResult = await search.startAfter(randomDocId).get();

  if (searchResult.empty) {
    searchResult = await search.endBefore(randomDocId).get();
  }

  return searchResult.docs[0];
}
*/

/**
 * Gets a random institution.
 * @returns The data of a random institution.
 */
/*
async function getRecommendedInstitution(): Promise<FirebaseFirestore.DocumentSnapshot> {
  return selectRandomDocument(admin.firestore().collection("institutions"));
}
*/

/**
 * Gets the followered users of the specified user id.
 */
async function getUserFollowingUids(userUid: string): Promise<string[]> {
  const doc = await admin
    .firestore()
    .doc(`users/${userUid}/following/default`)
    .get();

  if (!doc.exists) {
    return [];
  }

  return Object.keys(doc.data() as object);
}

/**
 * Generates the timeline for the calling user.
 */
export const getPostsHandler = async (data, context) => {
  let { cursor = undefined, limit = 10 } = data;
  limit = Math.min(limit, 20);

  let lastPost: FirebaseFirestore.DocumentData | null = null;

  if (cursor != null) {
    lastPost = await admin.firestore().doc(`posts/${cursor}`).get();
    if (!lastPost.exists) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid cursor.",
      );
    }
  }

  const uid = context.auth.uid;

  let postQuery = admin
    .firestore()
    .collection("posts")
    .limit(limit)
    .orderBy("timestamp", "desc");

  // Followed institutions
  const followingIds = await getUserFollowingUids(uid);

  if (followingIds.length > 0) {
    postQuery = postQuery.where("poster.uid", "in", followingIds);
  }

  // Construct data to return
  if (lastPost) {
    postQuery = postQuery.startAfter(lastPost);
  }

  const postDocs = (await postQuery.get()).docs;

  const postData = postDocs.map((doc) => {
    return {
      type: "post",
      post: transformFirestoreTypes(doc.data()),
    };
  });

  /*
  TODO: Suggested institutions will be added later
  if (postData.length > 0) {
    const recommended = await getRecommendedInstitution();

    postData.push({
      type: "institution",
      post: { uid: recommended.id, ...recommended.data() },
    });
  }
  */

  return {
    data: postData,
    nextCursor: postDocs.length > 0 ? postDocs[postDocs.length - 1].id : null,
  };
};

/*
const filterDuplicatePosts = (posts: PostModelSchema[]) => {
  return posts.filter((postLhs) => {
    for (const postRhs of posts) {
      if (postLhs === postRhs) {
        continue;
      }

      const distance = levenshtein.get(postLhs.text, postRhs.text);
      const bigger = Math.max(postLhs.text.length, postRhs.text.length);
      const error = (bigger - distance) / bigger;

      console.log(error);

      if (
        error < 0.05 &&
        differenceInDays(postLhs.timestamp, postRhs.timestamp) <= 1
      ) {
        console.log("FILTERED OUT", postLhs.media.url, postRhs.media.url);
        return false;
      }
      return true;
    }
  });
};
*/

export const doTwitterHandler = async (context) => {
  // const config = await ServerConfiguration.get();

  const query = admin
    .firestore()
    .collection("institutions")
    .select("socialMedia");

  // TODO: implement time-blocked requests
  // if (config.lastUpdatedInstitution != null) {
  //   query.startAfter(admin.firestore().doc(config.lastUpdatedInstitution));
  // }

  const institutions = InstitutionSchema.loadDataModelCollection(
    await query.get(),
    InstitutionSchema,
  );

  const batch = InstitutionSchema.getBatch();

  for (const institution of institutions) {
    for (const provider of PROVIDERS_TO_FETCH) {
      const socialData: SocialMediaUpdateSchema =
        institution.socialMedia[provider.name];

      // Cannot fetch data for this provider if there is no user id
      if (socialData.userId == null) {
        continue;
      }

      const posts = await provider.getPosts(socialData.userId, institution.uid);
      // posts = filterDuplicatePosts(posts);

      for (const post of posts) {
        if (socialData.lastUpdate && post.timestamp <= socialData.lastUpdate) {
          continue;
        }

        post.save(batch);
      }

      if (posts.length > 0) {
        socialData.lastUpdate = posts[0].timestamp;
      }
    }

    institution.save(batch);
  }

  // if (institutions.length > 0) {
  //   config.lastUpdatedInstitution = institutions[institutions.length - 1].ref;
  //   config.save();
  // }

  await batch.commit();
};
