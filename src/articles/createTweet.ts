import type { FeedItem } from './fetchArticles'

export async function createTweet(article: FeedItem) {
  const content = await getPrompt(article)

  const response = this.openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }]
  })

  const tweet = response.choices[0]?.message?.content?.trim() || ''

  try {
    await this.twitterClient.v2.tweet(tweet)
    console.log(`Tweeted: ${tweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
  }
}

export async function getPrompt(article: FeedItem) {
  const toneOptions = [
    'Write in a friendly, engaging tone.',
    'Write in a concise and informative tone.',
    'Encourage readers to explore more by reading the article.'
  ]

  const chosenTone = toneOptions[Math.floor(Math.random() * toneOptions.length)]

  return `
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

  // TODO: Don't include the twitter handle if it's not provided
}
