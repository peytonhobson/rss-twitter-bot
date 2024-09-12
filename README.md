# Twitter Bot Service

This package provides a Twitter bot service with RSS feed integration capabilities.

## Installation

To install the package, use your preferred package manager. Here is an example using `pnpm`:

```bash
pnpm install @rss-twitter-bot
```

## Features

- Post articles from RSS feeds to Twitter
- Optional MongoDB integration for tracking posted articles
- Free access to Twitter API functionality

## Usage

typescript

```typescript
import { TwitterBotService, RSSFeed } from 'twitter-bot-service';

const rssFeeds = [
  {
    feedUrl: 'https://example.com/article',
    twitterHandle: 'example'
  }
] as const satisfies RSSFeed[];

// Initialize the service
const twitterBot = new TwitterBotService({
  mongoUri: 'your-mongo-uri',
  twitterTokens: {
    accessToken: 'your-access-token',
    accessSecret: 'your-access-secret',
    appKey: 'your-app-key',
    appSecret: 'your-app-secret'
  },
  rettiwtApiKey: 'your-rettiwt-api-key',
  openaiApiKey: 'your-openai-api-key'
});

// Post the next oldest unposted article from the RSS feeds
twitterBot.postNextArticle({
  rssFeeds
});
```


## Configuration

- `mongoUri`: (Optional) MongoDB connection URI. If not provided, posted articles will not be tracked. This is useful if you want the bot to avoid posting duplicate articles.
- `rettiwtApiKey`: (Optional) API key for rettiwt-api. If not provided, certain features like creating polls will not be available.

## Rettiwt API Integration

This package uses the [rettiwt-api](https://www.npmjs.com/package/rettiwt-api) for free access to Twitter API functionality. To generate a rettiwt API key, follow the instructions provided in the rettiwt-api documentation.
