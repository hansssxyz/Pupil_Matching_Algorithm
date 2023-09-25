import { Model } from "shared";

export class StatsModel extends Model {
  static ref = "settings/stats";

  numberMentors: number;
  numberMentees: number;
  numberUsers: number;

  static async get(): Promise<StatsModel> {
    return Model.fromRef(StatsModel.ref, StatsModel);
  }
}
