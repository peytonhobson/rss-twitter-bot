import { TwitterApi } from 'twitter-api-v2';
import { r } from '@crossingminds/utils';
import { CustomTweetService } from './CustomTweetService';
import { getPollCardDataConfig, getPollTweetConfig } from './pollConfig';
export class TwitterService {
    params;
    twitterClient;
    customTweetService;
    constructor(params) {
        this.params = params;
        this.twitterClient = new TwitterApi(params.twitterTokens);
        if (params.rettiwtApiKey) {
            this.customTweetService = new CustomTweetService({
                apiKey: params.rettiwtApiKey
            });
        }
    }
    async postTweet(tweet) {
        try {
            await this.twitterClient.v2.tweet(tweet);
            // TODO: debug flag
            console.log(`Tweeted: ${tweet}`);
        }
        catch (error) {
            console.error('Error posting tweet:', error);
        }
    }
    async postThread(tweets) {
        try {
            await this.twitterClient.v2.tweetThread(tweets);
        }
        catch (error) {
            console.error('Error posting thread:', error);
        }
    }
    async postPoll({ question, content, options }) {
        if (this.customTweetService === undefined) {
            console.error('Polls cannot be created with a rettiwt API key.');
            return;
        }
        const cardData = await this.customTweetService.request(getPollCardDataConfig(options));
        const cardUri = r.object(cardData, ({ card_uri }) => r.string(card_uri));
        if (cardUri === undefined) {
            console.error('Error parsing cardUri');
            return;
        }
        await this.customTweetService.request(getPollTweetConfig({ text: `${question}\n\n${content}`, cardUri }));
    }
}
