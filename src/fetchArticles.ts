import RSSParser from 'rss-parser'

export interface FeedItem {
  title: string
  link: string
  pubDate: string
}

const rssParser = new RSSParser()

export async function fetchArticles(feedUrl: string) {
  const feed = await rssParser.parseURL(feedUrl)

  return feed.items.map(item => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate
  }))
}
