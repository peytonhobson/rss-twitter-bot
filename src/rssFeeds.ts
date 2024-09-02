export type RSSFeed = {
  feedLink: string
  twitterHandle: string | undefined
  twitterId?: string | undefined
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
    twitterHandle: 'PsychedVantage',
    twitterId: undefined
  },
  {
    feedLink: 'https://open-foundation.org/feed/',
    twitterHandle: 'OPEN_fndn',
    twitterId: undefined
  },
  {
    feedLink: 'https://intercollegiatepsychedelics.net/feed/',
    twitterHandle: 'ipnpsychedelics',
    twitterId: undefined
  },
  {
    feedLink: 'https://therapsil.ca/feed/',
    twitterHandle: 'TheraPsil',
    twitterId: undefined
  },
  {
    feedLink: 'https://psychedelicpress.substack.com/feed',
    twitterHandle: 'psypre',
    twitterId: undefined
  },
  {
    feedLink: 'https://psychedelicalpha.com/feed',
    twitterHandle: 'Psyched_Alpha',
    twitterId: undefined
  },
  {
    feedLink: 'https://www.drugtopics.com/rss',
    twitterHandle: 'Drug_Topics'
  },
  {
    feedLink: 'https://www.ecstaticintegration.org/feed',
    twitterHandle: 'JulesEvans11'
  },
  {
    feedLink: 'https://www.pharmavoice.com/feeds/news/',
    twitterHandle: 'PharmaVoice'
  },
  {
    feedLink: 'https://penumbrapsychedelic.com/feed/',
    twitterHandle: undefined
  },
  {
    feedLink: 'https://anchor.fm/s/9e62bff8/podcast/rss',
    twitterHandle: 'PsychedBrainSci'
  }
] as const satisfies RSSFeed[]
