# Twitter Bot Service

This package provides a Twitter bot service with RSS feed integration capabilities.

## Features

- Post articles from RSS feeds to Twitter
- Optional MongoDB integration for tracking posted articles
- Free access to Twitter API functionality

## Usage

typescript

```typescript
const rssFeeds = [
  {
    feedUrl: 'https://example.com/article',
    twitterHandle: 'example'
  }
] as const satisfies RSSFeed[];

// Initialize the service
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
```

It's important to note that the article title, link, content snippet, and associated twitter handle (if provided) will be added to the prompt to generate the tweet.


## Configuration

- `mongoUri`: (Optional) MongoDB connection URI. If not provided, posted articles will not be tracked. This is useful if you want the bot to avoid posting duplicate articles.
- `rettiwtApiKey`: (Optional) API key for rettiwt-api. If not provided, certain features like creating polls will not be available.

## Rettiwt API Integration

This package uses the [rettiwt-api](https://www.npmjs.com/package/rettiwt-api) for free access to Twitter API functionality. To generate a rettiwt API key, follow the instructions provided in the rettiwt-api documentation.
