import { MongoService } from '../database/MongoService';
import { TwitterService } from '../twitter/TwitterService';
import { OpenAIService } from '../openai/OpenAIService';
import { RSSService } from '../rss/RSSService';
export class CoreService {
    params;
    dbService;
    twitterService;
    openAIService;
    constructor(params) {
        this.params = params;
        const { mongoURI, customDbName, openaiKey, twitterTokens, rettiwtApiKey } = params;
        this.dbService = new MongoService({
            mongoURI,
            customDbName
        });
        this.twitterService = new TwitterService({
            twitterTokens,
            rettiwtApiKey
        });
        this.openAIService = new OpenAIService({
            openaiKey
        });
    }
    async postNextArticle({ rssFeeds, earliestPublishDate, customArticleFilter }) {
        const rssService = new RSSService({
            rssFeeds,
            dbService: this.dbService,
            twitterService: this.twitterService,
            openAIService: this.openAIService
        });
        await rssService.tweetNextArticle({
            earliestPublishDate,
            customArticleFilter
        });
        // TODO: More explicit logging with tweet
        console.log('Article posted');
    }
    async makeRandomComments() {
        console.log('Function not yet implemented');
        // Implement logic to make random comments on Twitter timelines
        // This method will use the twitterService to fetch timelines and post comments
        // It may also use the openAIService to generate comment content
    }
}
