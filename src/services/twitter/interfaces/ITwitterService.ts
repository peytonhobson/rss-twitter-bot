export interface ITwitterService {
  postTweet(content: string): Promise<void>
  postThread(tweets: string[]): Promise<void>
  postPoll(question: string, content: string, options: string[]): Promise<void>
}
