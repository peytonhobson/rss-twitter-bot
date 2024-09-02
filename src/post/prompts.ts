import { openaiClient } from '../openaiClient'
import type { FeedItem } from './fetchArticles'

export async function getRegularTweet(article: FeedItem) {
  const toneOptions = [
    'Write in a friendly, engaging tone.',
    'Write in a concise and informative tone.',
    'Encourage readers to explore more by reading the article.'
  ]

  const chosenTone = toneOptions[Math.floor(Math.random() * toneOptions.length)]

  const content = `
  You are a social media manager for a Twitter account focused on psychedelics. ${chosenTone} Create a unique tweet about the following article snippet. Use the template and example provided below to structure the tweet. Avoid using emojis. Make sure the tweet is concise, informative, and includes a call to action for readers to learn more. Add new lines at the end of each paragraph. Add hashtags at the end of the tweet.

  ### Template:
  {headline}

  From: @{twitterHandle} 
  
  Read More: {link}

  {summary}

  {call_to_action}

  ### Generate your tweet below following this format:
  
  Article Title: "${article.title}"
  Article Link: "${article.link}"
  Article Twitter Handle: "${article.twitterHandle || ''}"
  Snippet: "${article.contentSnippet.slice(0, 150)}"
  `

  const response = await openaiClient.chat.completions.create({
    messages: [{ role: 'user', content }],
    model: 'gpt-4o'
  })

  return response.choices[0].message.content.trim()
}

export async function getThreadTweet(article: FeedItem) {
  const content = `
  You are an expert in psychedelics and wellness. Break down the following article into a series of tweets (up to 5 tweets) that summarize the key points or findings of the article. Each tweet should be engaging and provide valye.  Add new lines at the end of each paragraph. Don't use emojis. There should only be one question in the thread and it should be at the end of the last tweet. The question should be thought-provoking and encourage readers to think more about the article. Only include the article link at the end of the last tweet.

  Article Title: "${article.title}"
  Snippet: "${article.content.slice(0, 2000)}"
  `

  const response = await openaiClient.chat.completions.create({
    messages: [{ role: 'user', content }],
    model: 'gpt-4o'
  })

  const tweet = response.choices[0].message.content.trim()

  return `
  Source: ${article.link}
  ${article.twitterHandle ? `From: @${article.twitterHandle}` : ''}

  ${tweet}
  `
}
