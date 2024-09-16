export interface IReplyService {
  /**
   * Posts a reply to a recent tweet from a random account.
   * @param params - The parameters for the reply service.
   * @param params.getPrompt - A function that returns a prompt for the reply.
   */
  postRandomReply: (params: { getPrompt: () => string }) => Promise<void>
}
