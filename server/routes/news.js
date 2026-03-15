import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import { 
  getLatestNews, 
  getFilteredNews,
  getNewsById 
} from '../services/polygonService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);
const finnhubCache = new NodeCache({ stdTTL: 120 });

// ── Finnhub general news (second source) ─────────────────────────────────────
async function getFinnhubNews(limit = 50) {
  const cacheKey = `finnhub_news_${limit}`;
  const cached = finnhubCache.get(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  try {
    const [general, forex] = await Promise.allSettled([
      axios.get('https://finnhub.io/api/v1/news', {
        params: { category: 'general', token: apiKey },
        timeout: 8000
      }),
      axios.get('https://finnhub.io/api/v1/news', {
        params: { category: 'forex', token: apiKey },
        timeout: 8000
      })
    ]);

    const rawArticles = [
      ...(general.status === 'fulfilled' ? general.value.data || [] : []),
      ...(forex.status  === 'fulfilled' ? forex.value.data  || [] : []),
    ];

    // Deduplicate by headline
    const seen = new Set();
    const articles = rawArticles
      .filter(a => a.headline && !seen.has(a.headline) && seen.add(a.headline))
      .slice(0, limit)
      .map(a => {
        const title = a.headline || '';
        const desc  = a.summary  || '';
        const text  = `${title} ${desc}`.toLowerCase();
        const highTerms = [
          'federal reserve','fed','fomc','interest rate','inflation','cpi','ppi','gdp',
          'nonfarm payroll','jobs report','employment','rate hike','rate cut',
          'war','crisis','breaking','sanctions','tariff','trade war','recession'
        ];
        const highScore = highTerms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0);
        const medTerms  = ['earnings','revenue','forecast','outlook','guidance','report','data'];
        const medScore  = medTerms.reduce((s, t) => s + (title.toLowerCase().includes(t) ? 1 : 0), 0);
        const impactLevel = highScore >= 1 ? 'High' : medScore >= 1 ? 'Medium' : 'Low';

        const bullish = ['surge','rally','soar','gain','rise','bullish','haven','buying'];
        const bearish = ['fall','drop','decline','bearish','weak','selling','deflation'];
        let bs = 0, be = 0;
        bullish.forEach(w => { if (text.includes(w)) bs++; });
        bearish.forEach(w => { if (text.includes(w)) be++; });
        const sentiment = bs > be ? 'Bullish' : be > bs ? 'Bearish' : 'Neutral';

        return {
          id:          `fh_${a.id || a.datetime}`,
          title,
          author:      a.source || 'Finnhub',
          source:      a.source || 'Finnhub',
          publishedAt: new Date(a.datetime * 1000).toISOString(),
          url:         a.url || '',
          imageUrl:    a.image || '',
          description: desc,
          keywords:    [],
          sentiment,
          impactLevel,
          ticker:      a.related ? a.related.split(',') : []
        };
      });

    finnhubCache.set(cacheKey, articles);
    console.log(`✅ Finnhub news: ${articles.length} articles`);
    return articles;
  } catch (err) {
    console.warn('⚠️  Finnhub news failed:', err.message);
    return [];
  }
}

// ── Merge + deduplicate by title ──────────────────────────────────────────────
function mergeNews(polygon, finnhub, limit) {
  const seen = new Set();
  const all  = [...polygon, ...finnhub].filter(a => {
    const key = a.title?.slice(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Sort by date descending
  all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return all.slice(0, limit);
}

// Get latest news with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { 
      keyword, 
      startDate, 
      endDate, 
      limit = 100
    } = req.query;
    const n = parseInt(limit);

    let [polygonNews, finnhubNews] = await Promise.allSettled([
      keyword || startDate || endDate
        ? getFilteredNews({ keyword, startDate, endDate, limit: n })
        : getLatestNews(n),
      getFinnhubNews(60)
    ]);

    const pNews = polygonNews.status  === 'fulfilled' ? polygonNews.value  : [];
    const fNews = finnhubNews.status  === 'fulfilled' ? finnhubNews.value  : [];

    let news = mergeNews(pNews, fNews, n);

    // Apply keyword filter to ALL merged results (Finnhub bypasses Polygon's filter)
    if (keyword) {
      const kw = keyword.toLowerCase();
      news = news.filter(a => {
        const text = `${a.title || ''} ${a.description || ''}`.toLowerCase();
        return text.includes(kw);
      });
    }

    // Apply date filters to Finnhub articles (Polygon already filters server-side)
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end   = endDate   ? new Date(endDate).getTime() + 86400000 : Infinity;
      news = news.filter(a => {
        const t = new Date(a.publishedAt).getTime();
        return t >= start && t <= end;
      });
    }

    res.json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (error) {
    next(error);
  }
});

// Get specific news by ID
router.get('/:id', async (req, res, next) => {
  try {
    const news = await getNewsById(req.params.id);
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    next(error);
  }
});

export default router;
