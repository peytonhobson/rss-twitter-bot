import { run } from '@crossingminds/utils'
import { OpenAI } from 'openai'
import { twitterClient } from './twitterClient'
import { shortenUrl } from './shortenUrl'
import type { FeedItem } from './fetchArticles'

async function getPrompt(article: FeedItem) {
  const shortenedLink = await shortenUrl(article.link)

  return `
  You are a social media manager for a Twitter account focused on psychedelics. Create a unique, engaging tweet about the following article snippet. Avoid using too many emojis. Make sure the tweet is concise, informative, and includes a call to action for readers to learn more. Also include relevant formatting, such as new lines and hashtags. Make sure total characters do not exceed 280.

  Article Title: "${article.title}"
  Article Link: "${shortenedLink}"
  Article Twitter Handle: "${article.twitterHandle}"
  Snippet: "${article.contentSnippet.slice(0, 150)}"
  `
}

const openaiClient = new OpenAI({
  apiKey: process.env['OPEN_AI_KEY'] // This is the default and can be omitted
})

export async function tweetArticle(article: FeedItem) {
  const content = await getPrompt(article)

  const response = await openaiClient.chat.completions.create({
    messages: [{ role: 'user', content }],
    model: 'gpt-4o-mini',
    max_tokens: 70
  })

  const tweet = response.choices[0]?.message?.content?.trim()

  // Ensure finalTweet is within 280 characters
  const finalTweet = run(() => {
    if (tweet.length > 280) {
      return `${tweet.substring(0, 277)}...`
    }

    return tweet
  })

  try {
    await twitterClient.v2.tweet(finalTweet)
    console.log(`Tweeted: ${finalTweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
    process.exit(1)
  }
}
