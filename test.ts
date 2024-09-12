import { RSSFeed, RSSTwitterBotService } from './src';

const rssFeeds = [
  {
    feedUrl: 'https://example.com/article',
    twitterHandle: 'example'
  }
] as const satisfies RSSFeed[];

// Initialize the service
const twitterBot = new RSSTwitterBotService({
  mongoUri: 'your-mongo-uri',
  twitterTokens: {
    accessToken: 'your-access-token',
    accessSecret: 'your-access-secret',
    appKey: 'your-app-key',
    appSecret: 'your-app-secret'
  },
  rettiwtApiKey: 'your-rettiwt-api-key',
  openaiApiKey: 'your-openai-api-key',
  rssFeeds
});

/* Post a tweet about the article */
twitterBot.postArticleTweet({
  textPrompt: `You are a social media manager for a Twitter account focused on dogs. Create a unique tweet about the following article snippet. Use the template and example provided below to structure the tweet. Avoid using emojis. Make sure the tweet is concise, informative, and includes a call to action for readers to learn more. Add new lines at the end of each paragraph. Add hashtags at the end of the tweet.`
});
