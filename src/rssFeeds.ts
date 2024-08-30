export type RSSFeed = {
  feedLink: string
  twitterHandle: string | undefined
  twitterId: string | undefined
}

// TODO: Don't include in repo
export const rssFeeds = [
  {
    feedLink: 'https://psychedelicstoday.com/feed/',
    twitterHandle: 'PsydelicsToday',
    twitterId: '738895917609275392'
  },
  {
    feedLink: 'https://maps.org/feed/',
    twitterHandle: 'MAPS',
    twitterId: '18824923'
  },
  {
    feedLink:
      'https://www.sciencedaily.com/rss/mind_brain/psychedelic_drugs.xml',
    twitterHandle: 'ScienceDaily',
    twitterId: '18700629'
  },
  {
    feedLink: 'https://psychedelicreview.com/feed/',
    twitterHandle: 'psyscireview',
    twitterId: '1029922220041101313'
  },
  {
    feedLink: 'https://hopkinspsychedelic.org/index?format=rss',
    twitterHandle: 'JHPsychedelics',
    twitterId: '968153029949222914'
  },
  {
    feedLink: 'https://microdosinginstitute.com/feed/',
    twitterHandle: undefined,
    twitterId: undefined
  },
  {
    feedLink: 'https://doubleblindmag.com/feed/',
    twitterHandle: 'doubleblindmag',
    twitterId: '1066849862824542208'
  },
  {
    feedLink: 'https://thethirdwave.co/feed/',
    twitterHandle: 'thirdwaveishere',
    twitterId: '4742168232'
  },
  {
    feedLink: 'https://www.lucid.news/feed/',
    twitterHandle: 'lucidnewssite',
    twitterId: '1237059664744976384'
  },
  {
    feedLink: 'https://chacruna.net/feed/',
    twitterHandle: 'Chacruna_Inst',
    twitterId: '836699972821123073'
  },
  {
    feedLink: 'https://www.psymposia.com/feed/',
    twitterHandle: 'psymposia',
    twitterId: '2362988556'
  },
  {
    feedLink: 'https://www.journalofpsychedelicpsychiatry.org/blog-feed.xml',
    twitterHandle: 'psychedelic_org',
    twitterId: '1163314105773637633'
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
