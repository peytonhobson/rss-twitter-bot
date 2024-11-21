import { AtpAgent, RichText } from '@atproto/api'

import * as cheerio from 'cheerio'
import type { TweetV2PostTweetResult } from 'twitter-api-v2'
import type { IBlueskyService } from './interfaces/IBlueskyService'

const BLUESKY_SOCIAL_SERVICE_URL = 'https://bsky.social'

export interface BlueskyServiceParams {
  blueskyIdentifier: string
  blueskyPassword: string
  enableDebug?: boolean
}

export class BlueskyService implements IBlueskyService {
  readonly #blueskyClient: AtpAgent
  readonly #blueskyCredentials: Pick<
    BlueskyServiceParams,
    'blueskyIdentifier' | 'blueskyPassword'
  >

  constructor(readonly params: BlueskyServiceParams) {
    this.#blueskyClient = new AtpAgent({
      service: BLUESKY_SOCIAL_SERVICE_URL
    })

    this.#blueskyCredentials = params
  }

  createThread(): Promise<TweetV2PostTweetResult[] | undefined> {
    throw new Error('Method not implemented.')
  }
  createPoll(): Promise<unknown | undefined> {
    throw new Error('Method not implemented.')
  }

  // Throws
  async login() {
    await this.#blueskyClient.login({
      identifier: this.#blueskyCredentials.blueskyIdentifier,
      password: this.#blueskyCredentials.blueskyPassword
    })
  }

  async createPost(text: string) {
    try {
      await this.login()

      const newText = text
        .replace('Read More: ', 'Read More')
        .replace(
          /https?:\/\/(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+([/a-zA-Z0-9-._~:?#[\]@!$&'()*+,;=]*)?/g,
          ''
        )

      // creating richtext
      const rt = new RichText({
        text: newText
      })
      await rt.detectFacets(this.#blueskyClient) // automatically detects mentions and links

      const extractedUrl = extractUrls(text)[0]
      const readMoreBytePositions = findReadMoreBytePositions(newText)

      if (extractedUrl && readMoreBytePositions) {
        rt.facets = rt.facets
          ? [
              ...rt.facets,
              {
                index: {
                  ...readMoreBytePositions
                },
                features: [
                  {
                    $type: 'app.bsky.richtext.facet#link',
                    uri: extractedUrl
                  }
                ]
              }
            ]
          : []
      }

      const thumbnail = await this.#getThumbnailFromUrl(extractedUrl)

      const postRecord = {
        $type: 'app.bsky.feed.post',
        text: rt.text.slice(0, 299),
        ...(rt.facets && { facets: rt.facets }),
        createdAt: new Date().toISOString(),
        ...(thumbnail && {
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: extractedUrl,
              ...thumbnail
            }
          }
        })
      }

      await this.#blueskyClient.post(postRecord)

      return rt.text
    } catch (error) {
      console.error('Error posting:', error)

      return undefined
    }
  }

  async #getThumbnailFromUrl(url: string | undefined) {
    if (!url) {
      return undefined
    }

    try {
      // Fetch the webpage's HTML
      const response = await fetch(url)

      const html = await response.text()

      // Load the HTML into Cheerio
      const $ = cheerio.load(html)

      // Attempt to find Open Graph image tag
      const ogImage = $('meta[property="og:image"]').attr('content')
      const ogTitle = $('meta[property="og:title"]').attr('content')
      const ogDescription = $('meta[property="og:description"]').attr('content')
      let imageUrl =
        (ogImage || $('meta[name="twitter:image"]').attr('content')) ?? ''
      imageUrl = new URL(imageUrl, url).href

      if (!imageUrl) {
        console.error('No thumbnail metadata found')
        return undefined
      }

      // Fetch the image data as a buffer
      const imageResponse = await fetch(imageUrl)
      const imageBlob = await imageResponse.blob()

      if (imageBlob && ogTitle && ogDescription) {
        const { data } = await this.#blueskyClient.uploadBlob(imageBlob)

        return {
          title: ogTitle,
          description: ogDescription,
          thumb: data.blob
        }
      }

      console.error('No thumbnail metadata found')
      return undefined
    } catch (error) {
      console.error('Error fetching URL:', error)
      return undefined
    }
  }
}

function extractUrls(text: string) {
  const urlRegex =
    /https?:\/\/(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+([/a-zA-Z0-9-._~:?#[\]@!$&'()*+,;=]*)?/g
  const matches = text.match(urlRegex)
  return matches || []
}

function findReadMoreBytePositions(text: string) {
  const searchPhrase = 'Read More'
  const buffer = Buffer.from(text, 'utf-8')
  const searchBuffer = Buffer.from(searchPhrase, 'utf-8')

  // Convert the text and search phrase to buffers
  const textLength = buffer.length
  const searchLength = searchBuffer.length

  // Iterate over the buffer to find the byte position
  for (let i = 0; i <= textLength - searchLength; i++) {
    let match = true
    for (let j = 0; j < searchLength; j++) {
      if (buffer[i + j] !== searchBuffer[j]) {
        match = false
        break
      }
    }
    if (match) {
      return { byteStart: i, byteEnd: i + searchLength }
    }
  }

  // Return null if "Read More" is not found
  return undefined
}
