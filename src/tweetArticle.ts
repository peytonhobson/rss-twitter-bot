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
  You are a social media manager for a Twitter account focused on psychedelics. ${chosenTone} Create a unique tweet about the following article snippet. Use the template and example provided below to structure the tweet. Ensure the article link appears right after the headline so that the associated image is previewed with the tweet. Avoid using emojis. Make sure the tweet is concise, informative, and includes a call to action for readers to learn more. Add new lines at the end of each paragraph. Add hashtags at the end of the tweet.

  ### Template:
  {headline}
  {twitterHandle} {link}
  {summary}
  {call_to_action}

  ### Example:

  MDMA Therapy: The Future of PTSD Treatment is Here

  Source: @psyedelics https://example.com/article

  Groundbreaking studies show MDMA-assisted therapy can help reduce PTSD symptoms by up to 80%. Learn how this innovative approach is changing lives.
  
  Read more and see how this treatment could change mental health care forever! 
  
  #MentalHealth #Psychedelics"

  ### Generate your tweet below following this format:
  
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
    model: 'gpt-4o'
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
