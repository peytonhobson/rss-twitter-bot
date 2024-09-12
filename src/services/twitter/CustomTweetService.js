import https from 'https';
import axios from 'axios';
import { AuthCredential } from 'rettiwt-auth';
import { isObjectGuard } from '@crossingminds/utils';
// NOTE: This is a workaround until the rettiwt-api package supports poll tweets
/**
 * The base service that handles all HTTP requests.
 *
 * @public
 */
export class CustomTweetService {
    /** The api key to use for authenticating against Twitter API as user. */
    apiKey;
    /**
     * @param config - The config object for configuring the Rettiwt instance.
     */
    constructor(config) {
        this.apiKey = config.apiKey;
    }
    static getUserId(apiKey) {
        // Getting the cookie string from the API key
        const cookieString = CustomTweetService.decodeCookie(apiKey);
        // Searching for the user id in the cookie string
        const searchResults = cookieString.match(/((?<=twid="u=)(.*)(?="))|((?<=twid=u%3D)(.*)(?=;))/);
        // If user id was found
        if (searchResults?.[0]) {
            return searchResults[0];
        }
        throw new Error('User ID not found');
    }
    static decodeCookie(encodedCookies) {
        // Decoding the encoded cookie string
        const decodedCookies = Buffer.from(encodedCookies, 'base64').toString('ascii');
        return decodedCookies;
    }
    /**
     * Returns the AuthCredentials based on the type of key present.
     *
     * @returns The generated AuthCredential
     */
    async getCredential() {
        return new AuthCredential(CustomTweetService.decodeCookie(this.apiKey).split(';'));
    }
    /**
     * Gets the https agent based on whether a proxy is used or not.
     *
     * @param proxyUrl - Optional URL with proxy configuration to use for requests to Twitter API.
     *
     * @returns The https agent to use.
     */
    getHttpsAgent() {
        return new https.Agent();
    }
    async getRequestConfig(startingConfig) {
        const httpsAgent = this.getHttpsAgent();
        // Getting credentials from key
        const cred = await this.getCredential();
        const config = {
            ...startingConfig,
            headers: { ...cred.toHeader(), ...startingConfig.headers },
            httpAgent: httpsAgent,
            httpsAgent: httpsAgent
        };
        return config;
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
    async request(startingConfig) {
        const config = await this.getRequestConfig(startingConfig);
        // Sending the request
        try {
            // Returning the reponse body
            return (await axios(config)).data;
        }
        catch (error) {
            if (isObjectGuard(error) && 'response' in error) {
                console.log(error.response);
            }
            else {
                console.log(error);
            }
            return undefined;
        }
    }
}
