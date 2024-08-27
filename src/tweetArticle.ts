import { OpenAI } from 'openai'
import { twitterClient } from './twitterClient'
import { shortenUrl } from './shortenUrl'
import type { FeedItem } from './fetchArticles'

async function getPrompt(article: FeedItem) {
  const toneOptions = [
    'Write in a friendly, engaging tone.',
    'Write in a concise and informative tone.',
    'Encourage readers to explore more by reading the article.'
  ]

  const chosenTone = toneOptions[Math.floor(Math.random() * toneOptions.length)]

  return `
  You are a social media manager for a Twitter account focused on psychedelics. ${chosenTone} Create a unique tweet about the following article snippet, but do not include the link or source information. Avoid using too many emojis. Make sure the tweet is concise, informative, and includes a call to action for readers to learn more. Also include relevant formatting, such as new lines and hashtags. Keep the tweet under 200 characters.

  Article Title: "${article.title}"
  Snippet: "${article.contentSnippet.slice(0, 150)}"
  `
}

const MAX_TWEET_LENGTH = 320

const openaiClient = new OpenAI({
  apiKey: process.env['OPEN_AI_KEY'] // This is the default and can be omitted
})

export async function tweetArticle(article: FeedItem) {
  const shortenedLink = await shortenUrl(article.link)
  const content = await getPrompt(article)

  const response = await openaiClient.chat.completions.create({
    messages: [{ role: 'user', content }],
    model: 'gpt-4o-mini'
  })

  const handleOrSource = article.twitterHandle
    ? `@${article.twitterHandle}`
    : new URL(article.link).hostname.replace('www.', '')

  // Define static content
  const staticContent = `\n\nSource: ${handleOrSource}\n\nRead more: ${shortenedLink}`

  let dynamicContent = response.choices[0]?.message?.content?.trim() || ''
  let tweet = `${dynamicContent}${staticContent}`

  // If the tweet is too long, trim the last sentence(s) of the dynamic content
  if (tweet.length > MAX_TWEET_LENGTH) {
    while (tweet.length > MAX_TWEET_LENGTH && dynamicContent.includes('.')) {
      const lastSentenceIndex = dynamicContent.lastIndexOf('.')
      dynamicContent = dynamicContent.substring(0, lastSentenceIndex + 1)
      tweet = `${dynamicContent}${staticContent}`
    }

    // If after trimming sentences it's still too long, throw
    if (tweet.length > MAX_TWEET_LENGTH) {
      console.error('Tweet is too long:', tweet)
      process.exit(1)
    }
  }

  console.log('Generated tweet:', tweet)
  console.log('Tweet length:', tweet.length)

  try {
    await twitterClient.v2.tweet(tweet)
    console.log(`Tweeted: ${tweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
    process.exit(1)
  }
}
