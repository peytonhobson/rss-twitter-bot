import { twitterClient } from './twitterClient'
import type { FeedItem } from './fetchArticles'

function formatTweet(article: FeedItem): string {
  const { title = 'Discover this insight', link, twitterHandle } = article

  const topic = extractTopicFromTitle(title)
  const keyInsight = extractKeyInsight(article)

  // Use the Twitter handle if available; otherwise, use the domain as the fallback
  const handleOrSource = twitterHandle
    ? `@${twitterHandle}`
    : new URL(link).hostname.replace('www.', '')

  const formats = [
    // Format 1
    `${title}\n\nFrom: ${handleOrSource}\n\nRead more: ${link}\n\n#Psychedelics #MentalHealth`,

    // Format 2
    `Discover how ${keyInsight || 'psychedelics can impact'} from ${handleOrSource}.\n\nRead more: ${link}\n\n#Psychedelics #Consciousness`,

    // Format 3
    `What can psychedelics teach us about ${topic || 'consciousness'}? ${handleOrSource} has the latest insights.\n\nFull article: ${link}\n\n#Psychedelics #Wellness`,

    // Format 4
    `"${keyInsight || 'New research shows interesting findings'}"\n\nLearn more from ${handleOrSource}: ${link}\n\n#Psychedelics #Science`,

    // Format 5
    `Get the latest from the experts at ${handleOrSource} on ${topic || 'psychedelics'}.\n\nRead the article: ${link}\n\n#Psychedelics #Research`
  ]

  // Randomly select a format
  const randomIndex = Math.floor(Math.random() * formats.length)
  return formats[randomIndex]
}

const keywords = [
  'Psychedelics',
  'Consciousness',
  'Wellness',
  'Microdosing',
  'Mental Health',
  'Healing',
  'Therapy',
  'Spirituality',
  'Transformation',
  'Mindfulness',
  'Research',
  'Psychedelic Science',
  'Self-Discovery',
  'Alternative Medicine',
  'Plant Medicine',
  'Integration',
  'Personal Growth',
  'Neuroplasticity',
  'Mind Expansion',
  'Holistic Health'
]

function extractTopicFromTitle(title: string): string | null {
  for (const keyword of keywords) {
    if (title.toLowerCase().includes(keyword)) {
      return keyword
    }
  }

  return undefined
}

function extractKeyInsight(article: FeedItem): string | null {
  if (article.contentSnippet) {
    const sentences = article.contentSnippet.split('. ')[0].split('.\n')
    return sentences[0] // Return the first sentence as the key insight
  }

  return undefined
}

export async function tweetArticle(article: FeedItem) {
  const tweet = formatTweet(article)

  try {
    await twitterClient.v2.tweet(tweet)
    console.log(`Tweeted: ${tweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
    process.exit(1)
  }
}
