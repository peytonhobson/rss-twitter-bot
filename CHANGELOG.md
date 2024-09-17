# rss-twitter-bot

## 0.1.10

### Patch Changes

- Fixed an issue where finding multiple documents in a db would always return an empty array.

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
