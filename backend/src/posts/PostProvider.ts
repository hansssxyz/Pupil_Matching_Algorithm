import { PostMediaSchema, PostSchema } from "shared";
import {
  TweetV2,
  TwitterApiReadOnly,
  TwitterV2IncludesHelper,
} from "twitter-api-v2";

export interface PostProvider {
  name: string;
  getPosts(socialId: string, posterId: string): Promise<PostSchema[]>;
}

export class TwitterPostProvider implements PostProvider {
  name: string = "twitter";
  twitterApi: TwitterApiReadOnly;

  constructor(twitterApi: TwitterApiReadOnly) {
    this.twitterApi = twitterApi;
  }

  private processTweet(
    tweet: TweetV2,
    includes: TwitterV2IncludesHelper,
    newPost: PostSchema,
  ): PostSchema {
    // Find media to use - prioritize attachment
    if (tweet.attachments != null) {
      const media = includes.medias(tweet)[0]; // First option (usually higher quality)
      newPost.media = new PostMediaSchema();

      newPost.media.url = media.url;
      newPost.media.width = media.width;
      newPost.media.height = media.height;

      if (media.type === "photo") {
        newPost.media.type = "photo";
      } else if (media.type === "video" || media.type === "animated_gif") {
        newPost.media.url = "video";
      }
    } else if (tweet.entities?.urls != null) {
      let found = false;

      for (const entity of tweet.entities.urls) {
        if (entity.images == null) {
          continue;
        }

        for (const image of entity.images) {
          newPost.media = new PostMediaSchema();
          newPost.media.url = image.url;
          newPost.media.width = image.width;
          newPost.media.height = image.height;
          newPost.media.type = "photo";
          found = true;
          break;
        }
        if (found) {
          break;
        }
      }
    }

    newPost.text = tweet.text;
    newPost.timestamp = new Date(tweet.created_at!);

    return newPost;
  }

  private async getRetweetedTweet(tweet: TweetV2): Promise<TweetV2 | null> {
    if (tweet.referenced_tweets == null) {
      return null;
    }

    const referencedTweet = tweet.referenced_tweets[0];

    if (referencedTweet.type !== "retweeted") {
      return null;
    }

    const tweetReq = await this.twitterApi.v2.singleTweet(referencedTweet.id, {
      "tweet.fields": [
        "entities",
        "attachments",
        "created_at",
        "referenced_tweets",
      ],
      "media.fields": ["url", "height", "width", "type", "public_metrics"],
      expansions: ["attachments.media_keys"],
    });

    tweet = tweetReq.data;

    tweet.text = `RT @${tweet.author_id}: ${tweet.text}`;

    return tweet;
  }

  public async batchGetPosts(ids: { [twitterId: string]: string }[]) {
    const returnPosts: PostSchema[] = [];

    const response = await this.twitterApi.v2.tweets(Object.keys(ids), {
      "tweet.fields": [
        "entities",
        "attachments",
        "created_at",
        "referenced_tweets",
      ],
      "media.fields": ["url", "height", "width", "type", "public_metrics"],
      expansions: ["attachments.media_keys", "referenced_tweets.id"],
    });
    const includes = new TwitterV2IncludesHelper(response);

    for (let tweet of response.data) {
      const newPost = new PostSchema();
      newPost.poster.type = "institution";

      // Invalid post
      if (tweet.author_id == null) {
        continue;
      }
      newPost.poster.uid = ids[tweet.author_id];

      tweet = (await this.getRetweetedTweet(tweet)) ?? tweet;

      this.processTweet(tweet, includes, newPost);

      returnPosts.push(newPost);
    }

    return returnPosts;
  }

  public async getPosts(
    twitterId: string,
    posterId: string,
  ): Promise<PostSchema[]> {
    const returnPosts: PostSchema[] = [];

    const response = await this.twitterApi.v2.userTimeline(twitterId, {
      "tweet.fields": ["entities", "attachments", "created_at"],
      "media.fields": ["url", "height", "width", "type", "public_metrics"],
      expansions: ["attachments.media_keys"],
    });

    for (const tweet of response) {
      const newPost = new PostSchema();
      newPost.poster.type = "institution";
      newPost.poster.uid = posterId;
      newPost.uid = tweet.id;

      this.processTweet(tweet, response.includes, newPost);

      returnPosts.push(newPost);
    }

    return returnPosts;
  }
}
