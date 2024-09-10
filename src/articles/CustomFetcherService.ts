import https from 'https'

import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Auth, AuthCredential } from 'rettiwt-auth'

import type { AxiosRequestConfig } from 'axios'
import type { IRettiwtConfig } from 'rettiwt-api'

import type { Agent } from 'https'

// NOTE: This is a workaround until the rettiwt-api package supports poll tweets
/**
 * The base service that handles all HTTP requests.
 *
 * @public
 */
class CustomFetcherService {
  /** The api key to use for authenticating against Twitter API as user. */
  private readonly apiKey?: string

  /** The URL To the proxy server to use for all others. */
  private readonly proxyUrl?: URL

  /** The max wait time for a response. */
  private readonly timeout: number

  /** The URL to the proxy server to use only for authentication. */
  protected readonly authProxyUrl?: URL

  /** The id of the authenticated user (if any). */
  protected readonly userId?: string

  /**
   * @param config - The config object for configuring the Rettiwt instance.
   */
  public constructor(config?: IRettiwtConfig) {
    this.apiKey = config?.apiKey
    this.userId = config?.apiKey
      ? CustomFetcherService.getUserId(config.apiKey)
      : undefined
    this.authProxyUrl = config?.authProxyUrl ?? config?.proxyUrl
    this.proxyUrl = config?.proxyUrl
    this.timeout = config?.timeout ?? 0
  }

  public static getUserId(apiKey: string): string {
    // Getting the cookie string from the API key
    const cookieString: string = CustomFetcherService.decodeCookie(apiKey)

    // Searching for the user id in the cookie string
    const searchResults: string[] | null = cookieString.match(
      /((?<=twid="u=)(.*)(?="))|((?<=twid=u%3D)(.*)(?=;))/
    )

    // If user id was found
    if (searchResults) {
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
  private async getCredential(): Promise<AuthCredential> {
    if (this.apiKey) {
      return new AuthCredential(
        CustomFetcherService.decodeCookie(this.apiKey).split(';')
      )
    } else {
      return await new Auth({
        proxyUrl: this.authProxyUrl
      }).getGuestCredential()
    }
  }

  /**
   * Gets the https agent based on whether a proxy is used or not.
   *
   * @param proxyUrl - Optional URL with proxy configuration to use for requests to Twitter API.
   *
   * @returns The https agent to use.
   */
  private getHttpsAgent(proxyUrl?: URL): Agent {
    if (proxyUrl) {
      return new HttpsProxyAgent(proxyUrl)
    } else {
      return new https.Agent()
    }
  }

  public async getRequestConfig(
    startingConfig: AxiosRequestConfig
  ): Promise<AxiosRequestConfig> {
    const httpsAgent: Agent = this.getHttpsAgent(this.proxyUrl)

    // Getting credentials from key
    const cred: AuthCredential = await this.getCredential()

    const config = {
      ...startingConfig,
      headers: { ...cred.toHeader(), ...startingConfig.headers },
      httpAgent: httpsAgent,
      httpsAgent: httpsAgent,
      timeout: this.timeout
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
  public async request<T>(startingConfig: AxiosRequestConfig): Promise<T> {
    const config = await this.getRequestConfig(startingConfig)

    // Sending the request
    try {
      // Returning the reponse body
      return (await axios<T>(config)).data
    } catch (error) {
      if ('response' in error) {
        console.log(error.response)
      } else {
        console.log(error)
      }
    }
  }
}

// TODO: Validation
export const customFetcherService = new CustomFetcherService({
  apiKey: process.env.RETTIWT_API_KEY
})
