import type { ITwitterService } from './services/twitter/interfaces/ITwitterService'
import type { IOpenAIService } from './services/openai/interfaces/IOpenAIService'
import type { IDatabaseService } from './services/database/interfaces/IDatabaseService'
import type { IArticlePostingService } from './features/articlePosting/interfaces/IArticlePostingService'
import type { IUserCommentsService } from './features/userComments/interfaces/IUserCommentsService'
import type { IPollCreationService } from './features/pollCreation/interfaces/IPollCreationService'

export class TwitterInteractionService {
  constructor(
    private twitterService: ITwitterService,
    private openAIService: IOpenAIService,
    private databaseService: IDatabaseService,
    private articlePostingService: IArticlePostingService,
    private userCommentsService: IUserCommentsService,
    private pollCreationService: IPollCreationService
  ) {}

  public async createTweet(tweet: string): Promise<void> {
    await this.twitterService.postTweet(tweet)
  }

  public async createThread(tweets: string[]): Promise<void> {
    await this.twitterService.postThread(tweets)
  }

  public async createPoll(
    question: string,
    content: string,
    options: string[]
  ): Promise<void> {
    await this.pollCreationService.createAndPostPoll(question, content, options)
  }

  public async postLatestArticles(): Promise<void> {
    await this.articlePostingService.fetchAndPostLatestArticles()
  }

  public async generateAndPostComments(): Promise<void> {
    await this.userCommentsService.generateAndPostComments()
  }

  // Add more high-level methods as needed
}
