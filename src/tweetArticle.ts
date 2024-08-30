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
  You are a social media manager for a Twitter account focused on psychedelics. ${chosenTone} Create a unique tweet about the following article snippet. Use the template provided below to structure the tweet. Ensure the article link appears right after the headline so that the associated image is previewed with the tweet. Avoid using emojis. Make sure the tweet is concise, informative, and includes a call to action for readers to learn more. Include relevant formatting, such as new lines and hashtags.

  ### Template:
  {headline}
  {link}
  {summary}
  {call_to_action}

  - **{headline}:** A compelling one-liner or phrase to grab attention, summarizing the article's main point or hook.
  - **{link}:** The article link: "${article.link}". Ensure this is placed immediately after the headline.
  - **{summary}:** A brief summary or key point from the article to provide more context (1-2 sentences).
  - **{call_to_action}:** A short, engaging call to action encouraging readers to read more or share their thoughts.

  Article Title: "${article.title}"
  Article Link: "${article.link}"
  Article Twitter Handle: "${article.twitterHandle || ''}"
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
