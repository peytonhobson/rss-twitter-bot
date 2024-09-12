import type { FeedItem } from './fetchArticles'

export function getThreadContent(article: FeedItem, textPrompt: string) {
  return `
  ${textPrompt}

  Article Title: "${article.title}"
  Snippet: "${article.content.slice(0, 2000)}"
  Article Link: "${article.link}"
  Article Twitter Handle: "${article.twitterHandle || ''}"
  `

  // TODO: Remove handle if not available
}
