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
    process.exit(1)
  }
}

export async function getOldestUnpostedArticle(db: Db, articles: FeedItem[]) {
  const filteredArticles = articles.sort(
    (a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime()
  )

  let oldestUnpostedArticle = undefined

  const lastPostedArticle = await db
    .collection('postedArticles')
    .find()
    .sort({ _id: -1 })
    .limit(1)
    .toArray()
    .then(arr => arr[0])

  if (lastPostedArticle) {
    const lastPostedArticleAuthor = new URL(lastPostedArticle.link).hostname

    const articlesByOtherAuthors = filteredArticles.filter(
      ({ link }) => new URL(link).hostname !== lastPostedArticleAuthor
    )

    for (const article of articlesByOtherAuthors) {
      if (!(await isArticlePosted(db, article.link))) {
        oldestUnpostedArticle = article
        break
      }
    }
  }

  if (oldestUnpostedArticle) {
    return oldestUnpostedArticle
  }

  for (const article of filteredArticles) {
    if (await isArticlePosted(db, article.link)) {
      oldestUnpostedArticle = article
      break
    }
  }

  return oldestUnpostedArticle
}
