import { OpenAI } from 'openai'
import { twitterClient } from './twitterClient'
import type { FeedItem } from './fetchArticles'

async function getPrompt(article: FeedItem) {
  const toneOptions = [
    'Write in a friendly, engaging tone.',
    'Write in a concise and informative tone.',
    'Encourage readers to explore more by reading the article.'
  ]

  const chosenTone = toneOptions[Math.floor(Math.random() * toneOptions.length)]

  return `
  You are a social media manager for a Twitter account focused on psychedelics. ${chosenTone} Create a unique tweet about the following article snippet, but do not include the link or source information. Avoid using too many emojis. Make sure the tweet is concise, informative, and includes a call to action for readers to learn more, as well as the article link and twitter handle if available. Also include relevant formatting, such as new lines and hashtags.

  Article Title: "${article.title}"
  Article Link: "${article.link}"
  Article Twitter Handle: "${article.twitterHandle}"
  Snippet: "${article.contentSnippet.slice(0, 150)}"
  `
}

const openaiClient = new OpenAI({
  apiKey: process.env['OPEN_AI_KEY']
})

export async function tweetArticle(article: FeedItem) {
  const content = await getPrompt(article)

  const response = await openaiClient.chat.completions.create({
    messages: [{ role: 'user', content }],
    model: 'gpt-4o-mini'
  })

  const tweet = response.choices[0].message.content.trim()

  try {
    await twitterClient.v2.tweet(tweet)
    console.log(`Tweeted: ${tweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
    process.exit(1)
  }
}
