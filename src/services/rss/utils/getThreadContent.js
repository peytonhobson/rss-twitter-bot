export async function getThreadContent(article) {
    return `
  You are an expert in psychedelics and wellness. Break down the following article into a series of tweets (up to 5 tweets) that summarize the key points or findings of the article. Each tweet should be engaging and provide value.  Add new lines at the end of each paragraph. Don't use emojis. There should only be one question in the thread and it should be at the end of the last tweet. The question should be thought-provoking and encourage readers to think more about the article. Only include the article link and twitter handle at the end of the last tweet.

  Article Title: "${article.title}"
  Snippet: "${article.content.slice(0, 2000)}"
  Article Link: "${article.link}"
  Article Twitter Handle: "${article.twitterHandle || ''}"
  `;
    // TODO: Remove handle if not available
}
