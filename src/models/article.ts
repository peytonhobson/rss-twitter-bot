import { r } from '@crossingminds/utils'

export type Article = {
  pubDate: string
  link: string
  content: string
  contentSnippet: string
  title: string
  twitterHandle: string | undefined
}

/**
 * Validates a single RSS feed item.
 * @param item - The RSS feed item to validate.
 * @returns A validated article object or undefined if validation fails.
 */
export function validateArticle(item: unknown): Article | undefined {
  return r.object(
    item,
    ({ pubDate, link, content, contentSnippet, title, twitterHandle }) => ({
      pubDate: r.required(r.string(pubDate)),
      link: r.required(r.string(link)),
      content: r.required(r.string(content)),
      contentSnippet: r.required(r.string(contentSnippet)),
      title: r.required(r.string(title)),
      twitterHandle: r.string(twitterHandle)
    })
  )
}

const POST_TYPES = ['thread', 'poll', 'tweet'] as const

export type PostedArticle = Article & {
  postType: (typeof POST_TYPES)[number]
}

export function validatePostedArticle(
  article: unknown
): PostedArticle | undefined {
  return r.object(article, ({ postType, ...rest }) => ({
    ...r.required(validateArticle(rest)),
    postType: r.required(r.oneOf(postType, POST_TYPES))
  }))
}
