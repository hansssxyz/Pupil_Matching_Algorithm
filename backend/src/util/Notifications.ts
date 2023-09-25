import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { UserPrivateDataSchema } from "shared";

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export interface PushMessage {
  data?: object;
  title?: string;
  subtitle?: string;
  body?: string;
  sound?:
    | "default"
    | null
    | {
        critical?: boolean;
        name?: "default" | null;
        volume?: number;
      };
  ttl?: number;
  expiration?: number;
  priority?: "default" | "normal" | "high";
  badge?: number;
  channelId?: string;
  categoryId?: string;
  mutableContent?: boolean;
}

export default class NotificationBatch {
  messages: ExpoPushMessage[] = [];

  async addMessage(message: PushMessage, privateData: UserPrivateDataSchema) {
    this.messages.push({
      to: privateData.pushTokens,
      ...message,
    });
  }

  async send() {
    const chunks = expo.chunkPushNotifications(this.messages);

    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  }
}
