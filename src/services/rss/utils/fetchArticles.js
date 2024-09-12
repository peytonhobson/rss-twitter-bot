import { daysToMilliseconds, r } from '@crossingminds/utils';
import RSSParser from 'rss-parser';
const DEFAULT_EARLIEST_PUBLISH_DATE = daysToMilliseconds(1);
const rssParser = new RSSParser();
export async function fetchArticles(rssFeed, earliestPublishDate) {
    try {
        const feed = await rssParser.parseURL(rssFeed.feedLink);
        const validatedFeedItems = validateFeedItems(feed.items);
        return validatedFeedItems
            .filter(item => {
            const pubDate = new Date(item.pubDate).getTime();
            /* Filter out articles that are older than the earliest publish date.
               If no earliest publish date is provided, default to 1 day */
            return (pubDate >
                Date.now() -
                    (earliestPublishDate?.getTime() ?? DEFAULT_EARLIEST_PUBLISH_DATE));
        })
            .map(item => ({
            ...item,
            twitterHandle: rssFeed.twitterHandle // Add Twitter handle to each feed item
        }));
    }
    catch (error) {
        console.error('Error parsing feed:', error, rssFeed);
        return [];
    }
}
function validateFeedItems(items) {
    const validatedItems = [];
    for (const item of items) {
        try {
            const validatedItem = validateFeedItem(item);
            if (validatedItem) {
                validatedItems.push(validatedItem);
            }
        }
        catch (error) {
            console.error('Error validating feed item:', error, item);
        }
    }
    return validatedItems;
}
function validateFeedItem(item) {
    return r.object(item, ({ pubDate, link, content, contentSnippet, ...rest }) => ({
        pubDate: r.required(r.string(pubDate)),
        link: r.required(r.string(link)),
        content: r.required(r.string(content)),
        contentSnippet: r.required(r.string(contentSnippet)),
        title: r.required(r.string(item.title)),
        ...rest
    }));
}
