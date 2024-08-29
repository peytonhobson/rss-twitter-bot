export type RSSFeed = {
  feedLink: string
  twitterHandle: string | undefined
}

// TODO: Don't include in repo
export const rssFeeds = [
  {
    feedLink: 'https://psychedelicstoday.com/feed/',
    twitterHandle: 'PsydelicsToday'
  },
  {
    feedLink: 'https://maps.org/feed/',
    twitterHandle: 'MAPS'
  },
  {
    feedLink:
      'https://www.sciencedaily.com/rss/mind_brain/psychedelic_drugs.xml',
    twitterHandle: 'ScienceDaily'
  },
  {
    feedLink: 'https://psychedelicreview.com/feed/',
    twitterHandle: 'psyscireview'
  },
  {
    feedLink: 'https://hopkinspsychedelic.org/index?format=rss',
    twitterHandle: 'JHPsychedelics'
  },
  {
    feedLink: 'https://doubleblindmag.com/feed/',
    twitterHandle: 'doubleblindmag'
  },
  {
    feedLink: 'https://thethirdwave.co/feed/',
    twitterHandle: 'thirdwaveishere'
  },
  {
    feedLink: 'https://www.lucid.news/feed/',
    twitterHandle: 'lucidnewssite'
  },
  {
    feedLink: 'https://microdosinginstitute.com/feed/',
    twitterHandle: undefined
  },
  {
    feedLink: 'https://chacruna.net/feed/',
    twitterHandle: 'Chacruna_Inst'
  },
  {
    feedLink: 'https://www.psymposia.com/feed/',
    twitterHandle: 'psymposia'
  },
  {
    feedLink: 'https://www.journalofpsychedelicpsychiatry.org/blog-feed.xml',
    twitterHandle: 'psychedelic_org'
  },
  {
    feedLink: 'https://psychedelicvantage.com/feed/',
    twitterHandle: 'PsychedVantage'
  },
  {
    feedLink: 'https://open-foundation.org/feed/',
    twitterHandle: 'OPEN_fndn'
  },
  {
    feedLink: 'https://intercollegiatepsychedelics.net/feed/',
    twitterHandle: 'ipnpsychedelics'
  },
  {
    feedLink: 'https://therapsil.ca/feed/',
    twitterHandle: 'TheraPsil'
  },
  {
    feedLink: 'https://psychedelicpress.substack.com/feed',
    twitterHandle: 'psypre'
  },
  {
    feedLink: 'https://psychedelicalpha.com/feed',
    twitterHandle: 'Psyched_Alpha'
  }
] as const satisfies RSSFeed[]
