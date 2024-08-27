import axios from 'axios'

export async function shortenUrl(longUrl: string): Promise<string> {
  const bitlyToken = process.env.BITLY_API_KEY // Store your Bitly API key in .env
  const bitlyApiUrl = 'https://api-ssl.bitly.com/v4/shorten'

  try {
    const response = await axios.post(
      bitlyApiUrl,
      { long_url: longUrl },
      { headers: { Authorization: `Bearer ${bitlyToken}` } }
    )
    return response.data.link // Return the shortened link
  } catch (error) {
    console.error('Error shortening URL:', error)
    return longUrl // Fallback to the original URL if shortening fails
  }
}
