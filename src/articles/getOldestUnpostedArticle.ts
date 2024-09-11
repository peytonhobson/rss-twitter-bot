import { POSTED_ARTICLE_COLLECTION_NAME } from './articleCollection'
import type { Db } from 'mongodb'
import type { FeedItem } from './fetchArticles'

async function isArticlePosted(db: Db, link: string): Promise<boolean> {
  try {
    const existingArticle = await db
      .collection(POSTED_ARTICLE_COLLECTION_NAME)
      .findOne({ link })

    return Boolean(existingArticle)
  } catch (error) {
    console.error('Error checking if article is posted:', error)

    /* Assume article is posted to avoid posting duplicates */
    return true
  }
}

export async function getOldestUnpostedArticle(
  db: Db | undefined,
  articles: FeedItem[]
) {
  const filteredArticles = articles.sort(
    (a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime()
  )

  let oldestUnpostedArticle: FeedItem | undefined = undefined

  const lastPostedArticle = await db
    ?.collection(POSTED_ARTICLE_COLLECTION_NAME)
    .find()
    .sort({ _id: -1 })
    .limit(1)
    .toArray()
    .then(arr => arr[0])

  const lastPostedArticleAuthor = lastPostedArticle
    ? new URL(lastPostedArticle.link).hostname
    : undefined

  /* Split articles by last posted author and other authors */
  const { articlesByLastPostedAuthor, articlesByOtherAuthors } =
    filteredArticles.reduce(
      (acc, article) => {
        const articleAuthor = new URL(article.link).hostname

        if (lastPostedArticle && articleAuthor === lastPostedArticleAuthor) {
          return {
            ...acc,
            articlesByLastPostedAuthor: [
              ...acc.articlesByLastPostedAuthor,
              article
            ]
          }
        }

        return {
          ...acc,
          articlesByOtherAuthors: [...acc.articlesByOtherAuthors, article]
        }
      },
      { articlesByLastPostedAuthor: [], articlesByOtherAuthors: [] }
    )

  /* If the last posted article is from a different author, 
     prioritize posting articles from other authors */
  if (lastPostedArticle) {
    for (const article of articlesByOtherAuthors) {
      if (db && !(await isArticlePosted(db, article.link))) {
        oldestUnpostedArticle = article
        break
      }
    }
  }

  /* If there are valid articles from other authors, 
     return the oldest unposted article */
  if (oldestUnpostedArticle) {
    return oldestUnpostedArticle
  }

  /* Check if there are any unposted articles from the last posted author */
  for (const article of articlesByLastPostedAuthor) {
    if (db && !(await isArticlePosted(db, article.link))) {
      oldestUnpostedArticle = article
      break
    }
  }

  return oldestUnpostedArticle
}
