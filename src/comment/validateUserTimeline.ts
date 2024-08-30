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
                r.object(entries, ({ entryId, sortIndex, content }) => ({
                  entryId: r.string(entryId),
                  sortIndex: r.string(sortIndex),
                  content: r.object(
                    content,
                    ({
                      entryType,
                      __typename,
                      itemContent,
                      clientEventInfo
                    }) => ({
                      entryType: r.string(entryType),
                      __typename: r.string(__typename),
                      itemContent: r.array(
                        itemContent,
                        itemContentInstance => itemContentInstance
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
}
