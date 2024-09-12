import type { FeedItem } from './fetchArticles'

export function isArticleSmallEnoughForThread(article: FeedItem): boolean {
  // Assuming 2,000 characters is a reasonable length for GPT-4 to generate a thread
  return article.content.length <= 2000
}
