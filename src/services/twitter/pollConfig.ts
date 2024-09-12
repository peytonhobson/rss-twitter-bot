import type { AxiosRequestConfig } from 'axios'
// TODO: Clean up and document

export function getPollCardDataConfig(options: string[]) {
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

export function getPollTweetConfig({
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
