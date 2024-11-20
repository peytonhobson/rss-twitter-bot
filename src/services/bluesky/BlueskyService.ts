import { AtpAgent } from '@atproto/api'

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
  readonly #enableDebug: boolean = false
  readonly #blueskyCredentials: Pick<
    BlueskyServiceParams,
    'blueskyIdentifier' | 'blueskyPassword'
  >

  constructor(readonly params: BlueskyServiceParams) {
    this.#blueskyClient = new AtpAgent({
      service: BLUESKY_SOCIAL_SERVICE_URL
    })

    this.#blueskyCredentials = params

    this.#enableDebug = Boolean(params.enableDebug)
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

      await this.#blueskyClient.post({
        text,
        createdAt: new Date().toISOString()
      })

      if (this.#enableDebug) {
        console.log('Posted bluesky post:', text)
      }

      return text
    } catch (error) {
      console.error('Error posting:', error)

      return undefined
    }
  }
}
