import https from 'https'

import axios from 'axios'
import { AuthCredential } from 'rettiwt-auth'

import { isObjectGuard } from '@crossingminds/utils'
import type { AxiosRequestConfig } from 'axios'

import type { Agent } from 'https'

// NOTE: This is a workaround until the rettiwt-api package supports poll tweets
/**
 * The base service that handles all HTTP requests.
 *
 * @public
 */
export class CustomTweetService {
  /** The api key to use for authenticating against Twitter API as user. */
  readonly #apiKey: string

  /**
   * @param config - The config object for configuring the Rettiwt instance.
   */
  public constructor(config: { apiKey: string }) {
    this.#apiKey = config.apiKey
  }

  public static getUserId(apiKey: string): string {
    // Getting the cookie string from the API key
    const cookieString: string = CustomTweetService.decodeCookie(apiKey)

    // Searching for the user id in the cookie string
    const searchResults: string[] | null = cookieString.match(
      /((?<=twid="u=)(.*)(?="))|((?<=twid=u%3D)(.*)(?=;))/
    )

    // If user id was found
    if (searchResults?.[0]) {
      return searchResults[0]
    }

    throw new Error('User ID not found')
  }

  public static decodeCookie(encodedCookies: string): string {
    // Decoding the encoded cookie string
    const decodedCookies: string = Buffer.from(
      encodedCookies,
      'base64'
    ).toString('ascii')

    return decodedCookies
  }

  /**
   * Returns the AuthCredentials based on the type of key present.
   *
   * @returns The generated AuthCredential
   */
  async #getCredential(): Promise<AuthCredential> {
    return new AuthCredential(
      CustomTweetService.decodeCookie(this.#apiKey).split(';')
    )
  }

  /**
   * Gets the https agent based on whether a proxy is used or not.
   *
   * @param proxyUrl - Optional URL with proxy configuration to use for requests to Twitter API.
   *
   * @returns The https agent to use.
   */
  #getHttpsAgent(): Agent {
    return new https.Agent()
  }

  public async getRequestConfig(
    startingConfig: AxiosRequestConfig
  ): Promise<AxiosRequestConfig> {
    const httpsAgent: Agent = this.#getHttpsAgent()

    // Getting credentials from key
    const cred: AuthCredential = await this.#getCredential()

    const config = {
      ...startingConfig,
      headers: { ...cred.toHeader(), ...startingConfig.headers },
      httpAgent: httpsAgent,
      httpsAgent: httpsAgent
    }

    return config
  }

  /**
   * Makes an HTTP request according to the given parameters.
   *
   * @param resource - The requested resource.
   * @param config - The request configuration.
   *
   * @typeParam T - The type of the returned response data.
   *
   * @returns The raw data response received.
   *
   * @example
   * Fetching the raw details of a user with username 'user1'
   * ```
   * import { FetcherService, EResourceType } from 'rettiwt-api';
   *
   * // Creating a new FetcherService instance using the given 'API_KEY'
   * const fetcher = new FetcherService({ apiKey: API_KEY });
   *
   * // Fetching the details of the User with username 'user1'
   * fetcher.request(EResourceType.USER_DETAILS_BY_USERNAME, { id: 'user1' })
   * .then(res => {
   * 	console.log(res);
   * })
   * .catch(err => {
   * 	console.log(err);
   * })
   * ```
   */
  public async request<T>(
    startingConfig: AxiosRequestConfig
  ): Promise<T | undefined> {
    const config = await this.getRequestConfig(startingConfig)

    // Sending the request
    try {
      // Returning the response body
      return (await axios<T>(config)).data
    } catch (error) {
      if (isObjectGuard(error) && 'response' in error) {
        console.log(error.response)
      } else {
        console.log(error)
      }

      return undefined
    }
  }
}
