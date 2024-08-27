import { OpenAI } from 'openai'
import { twitterClient } from './twitterClient'
import type { FeedItem } from './fetchArticles'

function getPrompt(article: FeedItem) {
  return `
  You are a social media manager for a Twitter account focused on psychedelics. Create a unique, engaging tweet about the following article snippet. Avoid using too many emojis. Make sure the tweet is concise, informative, and includes a call to action for readers to learn more. Also include relevant formatting, such as new lines and hashtags.

  Article Title: "${article.title}"
  Article Link: "${article.link}"
  Article Twitter Handle: "${article.twitterHandle}"
  Snippet: "${article.contentSnippet.slice(0, 150)}"
  `
}

const openaiClient = new OpenAI({
  apiKey: process.env['OPEN_AI_KEY'] // This is the default and can be omitted
})

export async function tweetArticle(article: FeedItem) {
  const response = await openaiClient.chat.completions.create({
    messages: [{ role: 'user', content: getPrompt(article) }],
    model: 'gpt-4o-mini'
  })

  const tweet = response.choices[0]?.message?.content?.trim()

  try {
    await twitterClient.v2.tweet(tweet)
    console.log(`Tweeted: ${tweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
    process.exit(1)
  }
}
