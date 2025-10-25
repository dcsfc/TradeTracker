"""
Data Sources Module - Fetch data from multiple sources
FIXED VERSION - Handles Free Twitter API & Reddit 401 Errors
"""

import os
import asyncio
from typing import List, Dict, Optional
import aiohttp
import tweepy
import asyncpraw
import feedparser
from datetime import datetime, timezone, timedelta
from loguru import logger
import time


class AsyncLimiter:
    """Simple async rate limiter"""
    def __init__(self, max_rate: int, time_period: int):
        self.max_rate = max_rate
        self.time_period = time_period
        self.tokens = max_rate
        self.updated_at = time.time()
        self._lock = asyncio.Lock()
        self.last_request_time = 0
    
    async def acquire(self):
        async with self._lock:
            # Add minimum delay between requests for free tier APIs
            now = time.time()
            time_since_last = now - self.last_request_time
            if time_since_last < 2:  # Minimum 2 seconds between requests
                await asyncio.sleep(2 - time_since_last)
            
            while self.tokens <= 0:
                self._add_tokens()
                if self.tokens <= 0:
                    await asyncio.sleep(1)
            self.tokens -= 1
            self.last_request_time = time.time()
    
    def _add_tokens(self):
        now = time.time()
        time_passed = now - self.updated_at
        new_tokens = time_passed * (self.max_rate / self.time_period)
        if new_tokens > 0:
            self.tokens = min(self.max_rate, self.tokens + new_tokens)
            self.updated_at = now
    
    async def __aenter__(self):
        await self.acquire()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


class DataSources:
    """Centralized data fetching from all sources with async support"""
    
    def __init__(self):
        self._twitter_client = None
        self._reddit_client = None
        
        # Conservative rate limiters for free tier APIs
        self.twitter_limiter = AsyncLimiter(5, 900)   # 5 requests per 15 minutes (very conservative)
        self.reddit_limiter = AsyncLimiter(30, 60)    # 30 requests per minute
        self.whale_limiter = AsyncLimiter(8, 60)      # 8 requests per minute (safe for free tier)
        
        # Track last successful fetch times to avoid hammering APIs
        self.last_twitter_fetch = 0
        self.last_reddit_fetch = 0
        self.twitter_cooldown = 900  # 15 minutes
        self.reddit_cooldown = 300   # 5 minutes
        
    def get_twitter_client(self):
        """Lazy load Twitter client with validation"""
        if self._twitter_client is None:
            bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
            if bearer_token and bearer_token not in ['your_twitter_bearer_token', '', 'None']:
                try:
                    self._twitter_client = tweepy.Client(bearer_token=bearer_token)
                    logger.info("Twitter client initialized (Free tier - limited requests)")
                except Exception as e:
                    logger.error(f"Failed to initialize Twitter client: {e}")
                    self._twitter_client = None
            else:
                logger.warning("Twitter Bearer Token not configured")
        return self._twitter_client
    
    async def get_reddit_client(self):
        """Lazy load async Reddit client with validation"""
        if self._reddit_client is None:
            client_id = os.getenv('REDDIT_CLIENT_ID')
            client_secret = os.getenv('REDDIT_CLIENT_SECRET')
            user_agent = os.getenv('REDDIT_USER_AGENT', 'crypto_prediction_bot_v1.0')
            
            if client_id and client_secret and client_id not in ['your_reddit_client_id', '', 'None']:
                try:
                    self._reddit_client = asyncpraw.Reddit(
                        client_id=client_id,
                        client_secret=client_secret,
                        user_agent=user_agent
                    )
                    logger.info("Async Reddit client initialized successfully")
                except Exception as e:
                    logger.error(f"Failed to initialize Reddit client: {e}")
                    self._reddit_client = None
            else:
                logger.warning("Reddit credentials not configured - using mock data")
        return self._reddit_client
    
    async def fetch_rss_feeds(self) -> List[Dict]:
        """Fetch crypto news from RSS feeds with error handling"""
        rss_urls = [
            "https://www.coindesk.com/arc/outboundfeeds/rss/",
            "https://cointelegraph.com/rss",
            "https://cryptonews.com/news/feed/",
        ]
        
        all_articles = []
        
        for url in rss_urls:
            try:
                logger.debug(f"Fetching RSS feed: {url}")
                
                # Use aiohttp for async fetching
                timeout = aiohttp.ClientTimeout(total=30)
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(url) as response:
                        if response.status == 200:
                            content = await response.text()
                            feed = feedparser.parse(content)
                            source_name = url.split('//')[1].split('.')[1].title()
                            
                            for entry in feed.entries[:10]:
                                article = {
                                    "title": entry.get("title", ""),
                                    "summary": entry.get("summary", ""),
                                    "link": entry.get("link", ""),
                                    "source": source_name,
                                    "published": entry.get("published_parsed", None)
                                }
                                all_articles.append(article)
                        else:
                            logger.warning(f"RSS feed {url} returned status {response.status}")
                            
            except asyncio.TimeoutError:
                logger.error(f"Timeout fetching RSS feed: {url}")
                continue
            except Exception as e:
                logger.error(f"Error fetching {url}: {e}")
                continue
        
        # Remove duplicates and sort
        seen_titles = set()
        unique_articles = []
        
        for article in all_articles:
            title = article["title"].lower().strip()
            if title not in seen_titles:
                seen_titles.add(title)
                unique_articles.append(article)
        
        unique_articles.sort(
            key=lambda x: x.get("published") or (0,)*9, 
            reverse=True
        )
        
        logger.info(f"Successfully fetched {len(unique_articles)} unique RSS articles")
        return unique_articles[:20]
    
    async def fetch_price_data(self, coin_ids: List[str] = None) -> Dict:
        """Fetch real-time price data from CoinGecko API with direct aiohttp calls"""
        if coin_ids is None:
            coin_ids = ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2']
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.debug(f"Fetching price data via aiohttp, attempt {attempt + 1}")
                
                # Use direct aiohttp call instead of pycoingecko
                url = "https://api.coingecko.com/api/v3/coins/markets"
                params = {
                    'vs_currency': 'usd',
                    'ids': ','.join(coin_ids),
                    'order': 'market_cap_desc',
                    'sparkline': 'true',
                    'price_change_percentage': '1h,24h,7d,30d'
                }
                
                timeout = aiohttp.ClientTimeout(total=30)
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            markets = await response.json()
                            
                            price_data = {}
                            for coin in markets:
                                price_data[coin['id']] = {
                                    'symbol': coin['symbol'].upper(),
                                    'current_price': coin['current_price'],
                                    'market_cap': coin['market_cap'],
                                    'total_volume': coin['total_volume'],
                                    'price_change_24h': coin.get('price_change_percentage_24h', 0),
                                    'price_change_7d': coin.get('price_change_percentage_7d_in_currency', 0),
                                    'price_change_30d': coin.get('price_change_percentage_30d_in_currency', 0),
                                    'sparkline': coin.get('sparkline_in_7d', {}).get('price', [])
                                }
                            
                            logger.info(f"Successfully fetched price data for {len(price_data)} coins")
                            return price_data
                        else:
                            logger.error(f"CoinGecko API error: {response.status}")
                            return {}
                
            except Exception as e:
                logger.error(f"Error fetching price data (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                else:
                    logger.error("Max retries exceeded for price data")
                    return {}
    
    async def fetch_historical_data(self, coin_id: str = 'bitcoin', days: int = 30) -> Dict:
        """Fetch historical OHLCV data with direct aiohttp calls"""
        try:
            logger.debug(f"Fetching historical data for {coin_id} via aiohttp")
            
            # Use direct aiohttp call instead of pycoingecko
            url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc"
            params = {
                'vs_currency': 'usd',
                'days': days
            }
            
            timeout = aiohttp.ClientTimeout(total=30)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Convert to structured format
                        historical = {
                            'timestamps': [d[0] for d in data],
                            'open': [d[1] for d in data],
                            'high': [d[2] for d in data],
                            'low': [d[3] for d in data],
                            'close': [d[4] for d in data]
                        }
                        
                        logger.info(f"Successfully fetched historical data: {len(data)} data points")
                        return historical
                    else:
                        logger.error(f"CoinGecko historical API error: {response.status}")
                        return {}
            
        except Exception as e:
            logger.error(f"Error fetching historical data: {e}")
            return {}
    
    async def fetch_whale_movements(self) -> Dict:
        """Fetch whale transaction data from Whale Alert with rate limiting"""
        async with self.whale_limiter:
            try:
                logger.debug("Fetching whale movements data")
                
                # Get API key from environment
                api_key = os.getenv('WHALE_ALERT_API_KEY')
                if not api_key or api_key in ['your_whale_alert_api_key', '', 'None']:
                    logger.warning("Whale Alert API key not configured, using mock data")
                    return self._get_mock_whale_data()
                
                url = "https://api.whale-alert.io/v1/transactions"
                
                # Calculate time range (last 1 hour)
                now = int(datetime.now(timezone.utc).timestamp())
                start_time = now - 3600
                end_time = now
                
                params = {
                    'start': start_time,
                    'end': end_time,
                    'limit': 100,
                    'min_value': 500000,  # Min $500k transactions
                    'api_key': api_key
                }
                
                timeout = aiohttp.ClientTimeout(total=30)
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            transactions = data.get('transactions', [])
                            
                            # Analyze transactions
                            whale_data = self._analyze_whale_transactions(transactions)
                            logger.info(f"Successfully fetched {len(transactions)} whale transactions")
                            return whale_data
                        elif response.status == 429:
                            logger.warning("Whale Alert API rate limit exceeded")
                            return self._get_mock_whale_data()
                        else:
                            error_text = await response.text()
                            logger.error(f"Whale Alert API error {response.status}: {error_text}")
                            return self._get_mock_whale_data()
                            
            except Exception as e:
                logger.error(f"Error fetching whale data: {e}")
                return self._get_mock_whale_data()
    
    def _analyze_whale_transactions(self, transactions: List[Dict]) -> Dict:
        """Analyze whale transactions for market signals"""
        large_transfers = []
        exchange_inflows = 0
        exchange_outflows = 0
        
        for tx in transactions:
            amount_usd = tx.get('amount_usd', 0)
            from_owner = tx.get('from', {}).get('owner_type', '')
            to_owner = tx.get('to', {}).get('owner_type', '')
            
            large_transfers.append({
                'symbol': tx.get('symbol', 'UNKNOWN'),
                'amount_usd': amount_usd,
                'from': from_owner,
                'to': to_owner,
                'timestamp': tx.get('timestamp')
            })
            
            # Track exchange flows
            if to_owner == 'exchange':
                exchange_inflows += amount_usd
            if from_owner == 'exchange':
                exchange_outflows += amount_usd
        
        net_flow = exchange_outflows - exchange_inflows
        
        # Determine whale sentiment
        if net_flow > 10_000_000:  # $10M+ net outflow
            whale_sentiment = 'accumulating'
        elif net_flow < -10_000_000:  # $10M+ net inflow
            whale_sentiment = 'distributing'
        else:
            whale_sentiment = 'neutral'
        
        return {
            'large_transfers': large_transfers[:10],
            'exchange_inflows': exchange_inflows,
            'exchange_outflows': exchange_outflows,
            'net_flow': net_flow,
            'whale_sentiment': whale_sentiment,
            'total_transactions': len(transactions)
        }
    
    def _get_mock_whale_data(self) -> Dict:
        """Return mock whale data when API unavailable"""
        return {
            'large_transfers': [
                {
                    'symbol': 'BTC',
                    'amount_usd': 1500000,
                    'from': 'unknown',
                    'to': 'exchange',
                    'timestamp': int(time.time())
                }
            ],
            'exchange_inflows': 2500000,
            'exchange_outflows': 1800000,
            'net_flow': -700000,
            'whale_sentiment': 'distributing',
            'total_transactions': 1,
            'mock': True
        }
    
    async def fetch_social_sentiment(self) -> Dict:
        """Fetch sentiment from Twitter and Reddit with proper async handling and cooldowns"""
        logger.debug("Starting social sentiment analysis")
        
        # Run both sentiment fetches concurrently
        twitter_task = self._fetch_twitter_sentiment()
        reddit_task = self._fetch_reddit_sentiment()
        
        results = await asyncio.gather(
            twitter_task, reddit_task, return_exceptions=True
        )
        
        twitter_sentiment = results[0]
        reddit_sentiment = results[1]
        
        # Handle exceptions
        if isinstance(twitter_sentiment, Exception):
            logger.error(f"Twitter sentiment error: {twitter_sentiment}")
            twitter_sentiment = {'score': 0.0, 'volume': 0, 'error': True}
            
        if isinstance(reddit_sentiment, Exception):
            logger.error(f"Reddit sentiment error: {reddit_sentiment}")
            reddit_sentiment = {'score': 0.0, 'volume': 0, 'error': True}
        
        # Combine sentiments
        combined_score = (twitter_sentiment.get('score', 0.0) + reddit_sentiment.get('score', 0.0)) / 2
        
        return {
            'twitter': twitter_sentiment,
            'reddit': reddit_sentiment,
            'combined_score': combined_score,
            'combined_volume': twitter_sentiment.get('volume', 0) + reddit_sentiment.get('volume', 0)
        }
    
    async def _fetch_twitter_sentiment(self) -> Dict:
        """Fetch crypto sentiment from Twitter with aggressive rate limiting for free tier"""
        
        # Check cooldown period (15 minutes minimum between fetches)
        current_time = time.time()
        time_since_last = current_time - self.last_twitter_fetch
        
        if time_since_last < self.twitter_cooldown:
            remaining = int(self.twitter_cooldown - time_since_last)
            logger.info(f"Twitter API cooldown active. {remaining}s remaining. Using cached/mock data.")
            return {'score': 0.0, 'volume': 0, 'mock': True, 'message': 'Cooldown active'}
        
        async with self.twitter_limiter:
            try:
                client = self.get_twitter_client()
                if not client:
                    logger.warning("Twitter client not initialized")
                    return {'score': 0.0, 'volume': 0, 'error': True, 'message': 'Client not initialized'}
                
                logger.info("Attempting Twitter API call (Free tier - very limited)")
                
                # Search crypto-related tweets with reduced scope for free tier
                query = 'bitcoin OR crypto -is:retweet lang:en'
                
                tweets = client.search_recent_tweets(
                    query=query,
                    max_results=10,  # Reduced to 10 for free tier
                    tweet_fields=['created_at', 'public_metrics']
                )
                
                # Update last successful fetch time
                self.last_twitter_fetch = time.time()
                
                if not tweets or not tweets.data:
                    logger.warning("No tweets found")
                    return {'score': 0.0, 'volume': 0}
                
                # Calculate engagement-weighted sentiment
                total_engagement = 0
                tweet_texts = []
                
                for tweet in tweets.data:
                    metrics = tweet.public_metrics
                    engagement = metrics['like_count'] + metrics['retweet_count']
                    total_engagement += engagement
                    tweet_texts.append(tweet.text)
                
                logger.info(f"Successfully fetched {len(tweets.data)} tweets")
                
                return {
                    'score': 0.0,  # Will be calculated by sentiment analyzer
                    'volume': len(tweets.data),
                    'total_engagement': total_engagement,
                    'tweets': tweet_texts[:10]
                }
                
            except tweepy.TooManyRequests as e:
                logger.error("Twitter API rate limit exceeded (429) - Free tier exhausted")
                logger.info(f"Setting {self.twitter_cooldown}s cooldown before next attempt")
                return {'score': 0.0, 'volume': 0, 'error': True, 'message': 'Rate limit exceeded - Free tier'}
            except tweepy.Unauthorized:
                logger.error("Twitter API unauthorized (401) - Check bearer token")
                return {'score': 0.0, 'volume': 0, 'error': True, 'message': 'Unauthorized'}
            except tweepy.Forbidden as e:
                logger.error(f"Twitter API forbidden (403) - Insufficient permissions: {e}")
                return {'score': 0.0, 'volume': 0, 'error': True, 'message': 'Forbidden - Free tier may not support this endpoint'}
            except Exception as e:
                logger.error(f"Twitter API error: {e}")
                return {'score': 0.0, 'volume': 0, 'error': True, 'message': str(e)}
    
    async def _fetch_reddit_sentiment(self) -> Dict:
        """Fetch crypto sentiment from Reddit using AsyncPRAW"""
        
        # Check cooldown period (5 minutes between fetches)
        current_time = time.time()
        time_since_last = current_time - self.last_reddit_fetch
        
        if time_since_last < self.reddit_cooldown:
            remaining = int(self.reddit_cooldown - time_since_last)
            logger.info(f"Reddit API cooldown active. {remaining}s remaining. Using cached/mock data.")
            return {'score': 0.0, 'volume': 0, 'mock': True, 'message': 'Cooldown active'}
        
        async with self.reddit_limiter:
            try:
                reddit = await self.get_reddit_client()
                if not reddit:
                    logger.warning("Reddit client not initialized - using mock data")
                    return {'score': 0.0, 'volume': 0, 'error': True, 'message': 'Client not initialized'}
                
                logger.info("Attempting Reddit API call")
                
                subreddits = ['cryptocurrency', 'bitcoin', 'cryptomarkets']
                posts = []
                
                for sub_name in subreddits:
                    try:
                        subreddit = await reddit.subreddit(sub_name)
                        
                        # Use async iteration with reduced limit
                        count = 0
                        async for post in subreddit.hot(limit=10):
                            posts.append({
                                'title': post.title,
                                'score': post.score,
                                'comments': post.num_comments,
                                'text': post.selftext if post.selftext else post.title
                            })
                            count += 1
                            if count >= 10:
                                break
                        
                        logger.debug(f"Fetched {count} posts from r/{sub_name}")
                        
                        # Add small delay between subreddit fetches
                        await asyncio.sleep(1)
                        
                    except Exception as e:
                        logger.error(f"Error fetching r/{sub_name}: {e}")
                        continue
                
                # Update last successful fetch time
                self.last_reddit_fetch = time.time()
                
                logger.info(f"Successfully fetched {len(posts)} Reddit posts")
                
                return {
                    'score': 0.0,  # Will be calculated by sentiment analyzer
                    'volume': len(posts),
                    'total_score': sum(p['score'] for p in posts),
                    'posts': [p['text'] for p in posts[:20]]
                }
                
            except Exception as e:
                logger.error(f"Reddit API error: {e}")
                return {'score': 0.0, 'volume': 0, 'error': True, 'message': str(e)}
    
    async def close(self):
        """Clean up async resources"""
        if self._reddit_client:
            try:
                await self._reddit_client.close()
                logger.info("Reddit client closed")
            except Exception as e:
                logger.error(f"Error closing Reddit client: {e}")


# Singleton instance
data_sources = DataSources()
