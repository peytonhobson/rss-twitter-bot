import type { FeedItem } from './fetchArticles'

export function getTweetContent(article: FeedItem, textPrompt: string) {
  return `
  ${textPrompt}
  
  Article Title: "${article.title}"
  Article Link: "${article.link}"
  Article Twitter Handle: "${article.twitterHandle || ''}"
  Snippet: "${article.contentSnippet.slice(0, 300)}"
  `

  // TODO: Don't include the twitter handle if it's not provided
}
