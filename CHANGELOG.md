# rss-twitter-bot

## 0.3.0

### Minor Changes

- Created BlueskyService for creating posts on bluesky platform.

## 0.2.4

### Patch Changes

- Simplified retrieving oldest unpublished article.

## 0.2.3

### Patch Changes

- Applied custom article filter to custom fetched articles.

## 0.2.2

### Patch Changes

- 30709eb: Created new filter to stop posting article from same author within 24 hours.

## 0.2.1

### Patch Changes

- Reintroduced polling with rettiwt.

## 0.2.0

### Minor Changes

- Added function to fetch additional custom articles.

## 0.1.16

### Patch Changes

- Limited PostedArticle fields to reduce db content.

## 0.1.15

### Patch Changes

- Added `createdAt` field to posted articles.

## 0.1.14

### Patch Changes

- Fixed issues with polling and reduced poll content parameter to single `tweet` param.

## 0.1.13

### Patch Changes

- Adapted `postPoll` to use twitter API.

## 0.1.12

### Patch Changes

- Bump for publish

## 0.1.11

### Patch Changes

- Fixed issue where poll params weren't be sanitized properly.

## 0.1.10

### Patch Changes

- Fixed issue where using the "find" method on the dbService would always return an empty array.

## 0.1.9

### Patch Changes

- Appended article link and twitter handle to threads if not already present.

## 0.1.8

### Patch Changes

- Added disconnect from db service.

## 0.1.7

### Patch Changes

- Added return object, including article and tweet response for personal DB use.

## 0.1.6

### Patch Changes

- Switched RSSService to use MongoService through composition rather than inheritance.

## 0.1.3

### Patch Changes

- Remove default max tokens from tweets.

## 0.1.2

### Patch Changes

- Removed max length from poll content.

## 0.1.1

### Patch Changes

- Added `findLatestPostedArticles` function to allow filtering by previous posts.

## 0.1.0

### Minor Changes

- Initial release of the RSS Twitter bot. Features include:
  - Fetching RSS feeds
  - Posting tweets automatically
  - Error handling and logging
