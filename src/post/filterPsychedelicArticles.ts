import type { FeedItem } from './fetchArticles'

export function filterPsychedelicArticles(article: FeedItem) {
  const psychedelicKeywords = [
    'psychedelic',
    'psilocybin',
    'lsd',
    'mdma',
    'ayahuasca',
    'dmt',
    'mescaline',
    'ibogaine',
    'ketamine',
    'microdosing',
    'macrodosing',
    'entheogens',
    'hallucinogens',
    'effects',
    'maps',
    'shroom',
    'trip'
  ]

  return psychedelicKeywords.some(keyword =>
    article.title.toLowerCase().includes(keyword)
  )
}
