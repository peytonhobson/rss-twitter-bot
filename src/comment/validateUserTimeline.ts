import { r } from '@crossingminds/utils'

export function validateUserTimeline(value: unknown) {
  // Validate the object above using the r library
  return r.object(value, ({ data }) =>
    r.object(data, ({ user }) =>
      r.object(user, ({ result }) =>
        r.object(result, ({ timeline }) =>
          r.object(timeline, ({ timeline: secondTimeline }) =>
            r.object(secondTimeline, ({ instructions }) =>
              r.array(instructions, ({ entries }) =>
                r.array(entries, entry =>
                  r.object(entry, ({ entryId, sortIndex, content }) => ({
                    entryId: r.string(entryId),
                    sortIndex: r.string(sortIndex),
                    content: r.object(
                      content,
                      ({ entryType, __typename, itemContent }) => ({
                        entryType: r.string(entryType),
                        __typename: r.string(__typename),
                        itemContent: r.object(
                          itemContent,
                          ({ tweet_results }) => ({
                            tweetResults: r.object(
                              tweet_results,
                              ({ result: tweetResult }) => ({
                                result: r.object(
                                  tweetResult,
                                  ({ legacy, rest_id }) => ({
                                    tweetId: r.string(rest_id),
                                    legacy: r.object(
                                      legacy,
                                      ({ full_text, created_at, ...rest }) => ({
                                        fullText: r.string(full_text),
                                        createdAt: r.string(created_at),
                                        ...rest
                                      })
                                    )
                                  })
                                )
                              })
                            )
                          })
                        )
                      })
                    )
                  }))
                )
              )
            )
          )
        )
      )
    )
  )
}
