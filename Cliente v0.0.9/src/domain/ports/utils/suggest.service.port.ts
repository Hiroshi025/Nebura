import { Suggest } from "@typings/modules/discord";

export interface ISuggestRepositoryPort {
  createSuggest(suggest: Partial<Suggest>): Promise<any | false>;
  updateUpvote(data: Partial<Suggest>, messageId: string): Promise<any | false>;
  getSuggestById(suggestId: string): Promise<any | false>;
  updateDownvote(data: Partial<Suggest>, messageId: string): Promise<any | false>;
  updateStatus(suggestId: string, status: string, resolvedBy: string): Promise<any | false>;
}