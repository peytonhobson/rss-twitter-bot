import type { Db } from 'mongodb'
import type { FeedItem } from './fetchArticles'

async function isArticlePosted(db: Db, link: string): Promise<boolean> {
  try {
    const existingArticle = await db
      .collection('postedArticles')
      .findOne({ link })

    return Boolean(existingArticle)
  } catch (error) {
    console.error('Error checking if article is posted:', error)

    /* Assume article is posted to avoid posting duplicates */
    return true
  }
}

export async function getOldestUnpostedArticle(db: Db, articles: FeedItem[]) {
  const filteredArticles = articles.sort(
    (a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime()
  )

  let oldestUnpostedArticle: FeedItem | undefined = undefined

  const lastPostedArticle = await db
    .collection('postedArticles')
    .find()
    .sort({ _id: -1 })
    .limit(1)
    .toArray()
    .then(arr => arr[0])

  const lastPostedArticleAuthor = new URL(lastPostedArticle.link).hostname

  /* Split articles by last posted author and other authors */
  const { articlesByLastPostedAuthor, articlesByOtherAuthors } =
    filteredArticles.reduce(
      (acc, article) => {
        const articleAuthor = new URL(article.link).hostname

        if (articleAuthor === lastPostedArticleAuthor) {
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
      if (!(await isArticlePosted(db, article.link))) {
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
    if (!(await isArticlePosted(db, article.link))) {
      oldestUnpostedArticle = article
      break
    }
  }

  return oldestUnpostedArticle
}
