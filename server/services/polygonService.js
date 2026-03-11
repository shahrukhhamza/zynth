import axios from 'axios';
import NodeCache from 'node-cache';
import { getApiKeyManager } from '../utils/apiKeyManager.js';
import ApiKeyManager from '../utils/apiKeyManager.js';

const cache = new NodeCache({ stdTTL: 30 }); // Cache for 30 seconds

// Get API key manager instance
const keyManager = getApiKeyManager();

const BASE_URL = 'https://api.polygon.io/v2/reference/news';

/**
 * Make API call with automatic key rotation on rate limit
 * @param {string} url - API endpoint URL
 * @param {object} params - Query parameters (excluding apiKey)
 * @param {number} maxRetries - Maximum retry attempts with different keys
 */
async function makeApiCallWithFallback(url, params = {}, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const keyInfo = keyManager.getCurrentKey();
    
    if (!keyInfo || !keyInfo.key) {
      throw new Error('No API keys available');
    }
    
    try {
      const response = await axios.get(url, {
        params: {
          ...params,
          apiKey: keyInfo.key
        }
      });
      
      // Success - mark as successful
      keyManager.markRequestSuccess(keyInfo.index);
      return response;
      
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (ApiKeyManager.isRateLimitError(error)) {
        console.log(`⚠️  Rate limit hit with key #${keyInfo.index + 1}, attempting rotation...`);
        keyManager.markCurrentKeyAsLimited();
        
        // If we have more keys to try, continue loop
        if (attempt < maxRetries - 1) {
          console.log(`🔄 Retrying with next available key (attempt ${attempt + 2}/${maxRetries})...`);
          continue;
        }
      } else {
        // Not a rate limit error, mark as failed but don't rotate
        keyManager.markRequestFailed(keyInfo.index, false);
        throw error;
      }
    }
  }
  
  // All retries exhausted
  throw lastError || new Error('All API keys exhausted or rate limited');
}

// Keywords for broader financial/macro relevance check
const GOLD_KEYWORDS = [
  'gold', 'xauusd', 'precious metals', 'bullion', 'silver', 'platinum',
  'inflation', 'interest rate', 'federal reserve', 'fed', 'fomc',
  'dollar', 'usd', 'treasury', 'bonds', 'yield', 'rate hike', 'rate cut',
  'geopolitics', 'war', 'conflict', 'sanctions', 'tariff', 'trade war',
  'central bank', 'monetary policy', 'recession', 'stagflation',
  'cpi', 'ppi', 'gdp', 'nfp', 'jobs', 'payroll', 'unemployment',
  'stock', 'market', 'equity', 'rally', 'crash', 'correction',
  'oil', 'crude', 'energy', 'bitcoin', 'crypto', 'commodities',
  'china', 'europe', 'ecb', 'boj', 'bank of england', 'imf', 'world bank',
  'earnings', 'revenue', 'profit', 'economic', 'finance', 'trading'
];

// Sentiment analysis based on keywords
function analyzeSentiment(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  const bullishKeywords = [
    'surge', 'rally', 'soar', 'gain', 'rise', 'up', 'bullish',
    'inflation surge', 'rate hike', 'weak dollar', 'conflict',
    'uncertainty', 'haven', 'safe-haven', 'buying'
  ];
  
  const bearishKeywords = [
    'fall', 'drop', 'decline', 'down', 'bearish', 'weak',
    'strong dollar', 'rate cut', 'selling', 'deflation'
  ];
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  bullishKeywords.forEach(keyword => {
    if (text.includes(keyword)) bullishScore++;
  });
  
  bearishKeywords.forEach(keyword => {
    if (text.includes(keyword)) bearishScore++;
  });
  
  if (bullishScore > bearishScore) return 'Bullish';
  if (bearishScore > bullishScore) return 'Bearish';
  return 'Neutral';
}

// Determine impact level
function getImpactLevel(article) {
  const title = (article.title || '').toLowerCase();
  const desc  = (article.description || '').toLowerCase();
  const text  = `${title} ${desc}`;
  
  const highImpactTerms = [
    'federal reserve', 'fed', 'fomc', 'interest rate', 'rate decision',
    'inflation', 'cpi', 'ppi', 'gdp', 'nonfarm payroll', 'jobs report',
    'employment', 'unemployment', 'rate hike', 'rate cut',
    'war', 'crisis', 'breaking', 'alert', 'emergency', 'sanctions',
    'tariff', 'trade war', 'default', 'recession', 'stagflation',
    'bank collapse', 'market crash', 'flash crash', 'yield curve'
  ];

  const highImpactScore = highImpactTerms.reduce((score, term) => {
    return score + (text.includes(term) ? 1 : 0);
  }, 0);
  
  if (highImpactScore >= 1) return 'High';
  // title-only medium check
  const mediumTerms = ['earnings', 'revenue', 'forecast', 'outlook', 'guidance', 'report', 'data'];
  const mediumScore = mediumTerms.reduce((s, t) => s + (title.includes(t) ? 1 : 0), 0);
  if (mediumScore >= 1) return 'Medium';
  return 'Low';
}

// Check if article is relevant — broad financial filter, keeps most articles
function isRelevant(article) {
  if (!article.title) return false;
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  const kws  = (article.keywords || []).map(k => k.toLowerCase());
  // Accept if any keyword matches OR if no keyword list is provided (broad acceptance)
  return kws.length === 0 || GOLD_KEYWORDS.some(keyword =>
    text.includes(keyword) || kws.some(k => k.includes(keyword))
  );
}

// Transform Polygon API response to our format
function transformArticle(article) {
  return {
    id: article.id,
    title: article.title,
    author: article.author || 'Unknown',
    source: article.publisher?.name || 'Unknown',
    publishedAt: article.published_utc,
    url: article.article_url,
    imageUrl: article.image_url,
    description: article.description || '',
    keywords: article.keywords || [],
    sentiment: analyzeSentiment(article.title, article.description || ''),
    impactLevel: getImpactLevel(article),
    ticker: article.tickers || []
  };
}

// Get latest news
export async function getLatestNews(limit = 50) {
  const cacheKey = `news_latest_${limit}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log('📦 Returning cached news');
    return cached;
  }

  try {
    const response = await makeApiCallWithFallback(BASE_URL, {
      limit: Math.min(limit * 5, 1000), // fetch much more then filter
      order: 'desc'
    });

    if (!response.data || !response.data.results) {
      throw new Error('Invalid response from Polygon API');
    }

    // Transform all articles — relevance filter is now very broad
    const articles = response.data.results
      .map(transformArticle)
      .slice(0, limit);

    cache.set(cacheKey, articles);
    console.log(`✅ Fetched ${articles.length} relevant articles`);
    
    return articles;
  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    throw new Error(`Failed to fetch news: ${error.message}`);
  }
}

// Get filtered news
export async function getFilteredNews({ keyword, startDate, endDate, limit = 50 }) {
  try {
    const params = {
      limit: limit * 2,
      order: 'desc'
    };

    if (startDate) {
      params['published_utc.gte'] = startDate;
    }
    if (endDate) {
      params['published_utc.lte'] = endDate;
    }

    const response = await makeApiCallWithFallback(BASE_URL, params);

    if (!response.data || !response.data.results) {
      throw new Error('Invalid response from Polygon API');
    }

    let articles = response.data.results.filter(isRelevant);

    // Apply keyword filter if provided
    if (keyword) {
      const keywordLower = keyword.toLowerCase();
      articles = articles.filter(article => {
        const text = `${article.title} ${article.description || ''}`.toLowerCase();
        return text.includes(keywordLower);
      });
    }

    articles = articles.slice(0, limit).map(transformArticle);
    
    console.log(`✅ Fetched ${articles.length} filtered articles`);
    return articles;
  } catch (error) {
    console.error('❌ Error fetching filtered news:', error.message);
    throw new Error(`Failed to fetch filtered news: ${error.message}`);
  }
}

// Get news by ID
export async function getNewsById(id) {
  try {
    const response = await makeApiCallWithFallback(`${BASE_URL}/${id}`, {});

    if (!response.data) {
      throw new Error('News article not found');
    }

    return transformArticle(response.data);
  } catch (error) {
    console.error('❌ Error fetching news by ID:', error.message);
    throw new Error(`Failed to fetch news: ${error.message}`);
  }
}
