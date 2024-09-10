import { r } from '@crossingminds/utils'
import { openaiClient } from '../clients/openaiClient'
import { customFetcherService } from './CustomFetcherService'
import type { AxiosRequestConfig } from 'axios'
import type { FeedItem } from './fetchArticles'

/** Create a twitter poll based on an article */
export async function createPoll(article: FeedItem) {
  try {
    const { question, content, options } =
      await generatePollQuestionAndOptions(article)

    /* Ensure options are unique and within Twitter's requirements (2-4 options) */
    const uniqueOptions = Array.from(new Set(options))
      .slice(0, 4)
      .map(option => option.toString())

    const cardUri = await generateCardUI({
      options: uniqueOptions
    })

    await customFetcherService.request(
      getPollTweetConfig({ text: `${question}\n\n${content}`, cardUri })
    )

    // TODO: Better log
    console.log(`Poll created: ${question}`)
  } catch (error) {
    console.error('Failed to create poll tweet:', error)
  }
}

/** Using OpenAI's structured response format, generate a poll
 *  question, content, and options based on an article */
async function generatePollQuestionAndOptions(article: FeedItem) {
  const content = `
  You are an expert in psychedelics and wellness. Based on the following article snippet, create a Twitter poll question, a comment about the article, and four possible options that encourage engagement and thoughtful discussion. The poll should be relevant to the main topic of the article. The output should be in the following JSON format:

  {
    "question": "string",
    "options": ["string", "string", "string", "string"]
  }

  Ensure the poll question is under 100 characters and each option is under 25 characters.

  Article Title: "${article.title}"
  Article Link: "${article.link}"
  Article Twitter Handle: "${article.twitterHandle}"
  Article Snippet: "${article.contentSnippet.slice(0, 300)}"
  `

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    temperature: 0.8,
    functions: [
      {
        name: 'generate_poll',
        description: 'Generate a poll question, content, and four options',
        parameters: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description:
                'The poll question that is engaging and relevant to the topic.',
              maxLength: 100
            },
            content: {
              type: 'string',
              description: `A comment about the article that is engaging and relevant to the topic, as well as the article title, link, and twitter handle.
                

                ###Format###

                {comment}

                Read More: {link}
                @{twitterHandle}
                `,
              maxLength: 100
            },
            options: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 25
              },
              minItems: 2,
              maxItems: 4,
              description:
                'Four possible poll options that are under 25 characters each'
            }
          },
          required: ['question', 'options']
        }
      }
    ],
    function_call: { name: 'generate_poll' }
  })

  const pollData = response.choices[0]?.message.function_call?.arguments

  if (pollData) {
    // TODO: validate these types
    const { question, content: tweetContent, options } = JSON.parse(pollData)

    return { question, content: tweetContent, options }
  } else {
    // TODO: Throw error?
    throw new Error('Failed to generate poll question and options.')
  }
}

/* Because the Twitter API is not public, we need to use a custom fetcher service to make requests.
   First we make a request to get the card data for the poll. Then we make a request to create the poll tweet. */
export async function generateCardUI({ options }: { options: string[] }) {
  /* Make request for card_uri */
  const cardData = await customFetcherService.request(
    getPollCardDataConfig(options)
  )

  const cardUri = r.object(cardData, ({ card_uri }) => r.string(card_uri))

  if (cardUri === undefined) {
    console.error('Error parsing cardUri')
  }

  return cardUri
}

function getPollCardDataConfig(options: string[]) {
  const cardData = {
    'twitter:card': 'poll4choice_text_only',
    'twitter:api:api:endpoint': '1',
    'twitter:long:duration_minutes': 1440,
    // TODO: Support different lengths of options
    'twitter:string:choice1_label': options[0],
    'twitter:string:choice2_label': options[1],
    'twitter:string:choice3_label': options[2],
    'twitter:string:choice4_label': options[3]
  }

  const jsonString = JSON.stringify(cardData)

  const data = new URLSearchParams()
  data.append('card_data', jsonString)

  return {
    method: 'post',
    url: 'https://caps.x.com/v2/cards/create.json',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data
  }
}

function getPollTweetConfig({
  text,
  cardUri
}: {
  text: string
  cardUri: string
}): AxiosRequestConfig {
  return {
    method: 'post',
    url: 'https://x.com/i/api/graphql/xT36w0XM3A8jDynpkram2A/CreateTweet',
    data: {
      variables: {
        tweet_text: text,
        card_uri: cardUri,
        dark_request: false,
        media: {
          media_entities: [],
          possibly_sensitive: false
        },
        semantic_annotation_ids: [],
        // eslint-disable-next-line no-null/no-null
        disallowed_reply_options: null
      },
      features: {
        communities_web_enable_tweet_community_results_fetch: true,
        c9s_tweet_anatomy_moderator_badge_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: true,
        tweet_awards_web_tipping_enabled: false,
        creator_subscriptions_quote_tweet_preview_enabled: false,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: true,
        articles_preview_enabled: true,
        rweb_video_timestamps_enabled: true,
        rweb_tipjar_consumption_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
          true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled:
          false,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_enhance_cards_enabled: false
      }
    }
  }
}
