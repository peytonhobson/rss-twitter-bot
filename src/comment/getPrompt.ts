export function getPrompt(tweetText: string) {
  const prompts = [
    `
    You are an expert in psychedelics and wellness. Generate a thoughtful and thought-provoking comment in response to the following tweet:
    
    Tweet: "${tweetText}"
    
    Provide an insight that adds depth to the conversation and encourages readers to think critically. Avoid using emojis and hashtags.
    
    Keep it under 250 characters.
    `,
    `
    You are an expert in psychedelics and wellness. Generate a supportive and affirming comment in response to the following tweet:
    
    Tweet: "${tweetText}"
    
    Provide a supportive perspective that agrees with the main point of the tweet, encouraging the author and readers. Avoid using emojis and hashtags.
    
    Keep it under 250 characters.
    `,
    `
    You are an expert in psychedelics and wellness. Generate an engaging comment in response to the following tweet:
    
    Tweet: "${tweetText}"
    
    Pose a thought-provoking question that encourages further discussion or reflection. Avoid using emojis and hashtags.
    
    Keep it under 250 characters.
    `,
    `
    You are an expert in psychedelics and wellness. Generate a comment in response to the following tweet that provides additional information or facts:
    
    Tweet: "${tweetText}"
    
    Add a relevant fact or piece of information that complements the tweet's topic and adds value to the conversation. Avoid using emojis and hashtags.
    
    Keep it under 250 characters.
    `,
    `
    You are an expert in psychedelics and wellness. Generate a reflective comment in response to the following tweet:
    
    Tweet: "${tweetText}"
    
    Share a personal experience or a reflection that relates to the tweet's content, making the conversation more personal. Avoid using emojis and hashtags.
    
    Keep it under 250 characters.
    `
  ]

  return prompts[Math.floor(Math.random() * prompts.length)]
}
