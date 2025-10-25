"""
TTL Cache Implementation for Backend Performance Optimization
High-performance in-memory cache with automatic expiration
"""

import asyncio
import time
from typing import Any, Dict, Optional, Tuple
from collections import OrderedDict
from loguru import logger


class TTLCache:
    """
    Thread-safe TTL cache with LRU eviction
    Optimized for high-frequency API caching
    """
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        """
        Initialize TTL cache
        
        Args:
            max_size: Maximum number of items to store (LRU eviction)
            default_ttl: Default TTL in seconds (5 minutes)
        """
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self._lock = asyncio.Lock()
        
        # Statistics
        self._hits = 0
        self._misses = 0
        self._evictions = 0
        self._total_requests = 0
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found/expired
        """
        async with self._lock:
            self._total_requests += 1
            
            if key not in self._cache:
                self._misses += 1
                return None
            
            value, expiry = self._cache[key]
            
            # Check if expired
            if time.time() > expiry:
                del self._cache[key]
                self._misses += 1
                return None
            
            # Move to end (LRU)
            self._cache.move_to_end(key)
            self._hits += 1
            
            return value
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: TTL in seconds (uses default if None)
        """
        async with self._lock:
            if ttl is None:
                ttl = self.default_ttl
            
            expiry = time.time() + ttl
            
            # Remove existing key if present
            if key in self._cache:
                del self._cache[key]
            
            # Add new entry
            self._cache[key] = (value, expiry)
            
            # Evict if over capacity
            while len(self._cache) > self.max_size:
                self._cache.popitem(last=False)  # Remove oldest
                self._evictions += 1
    
    async def delete(self, key: str) -> bool:
        """
        Delete key from cache
        
        Args:
            key: Cache key
            
        Returns:
            True if key was deleted, False if not found
        """
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    async def clear(self) -> None:
        """Clear all cache entries"""
        async with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
            self._evictions = 0
            self._total_requests = 0
    
    async def cleanup_expired(self) -> int:
        """
        Remove expired entries
        
        Returns:
            Number of expired entries removed
        """
        async with self._lock:
            current_time = time.time()
            expired_keys = []
            
            for key, (_, expiry) in self._cache.items():
                if current_time > expiry:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self._cache[key]
            
            return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache statistics
        """
        hit_rate = (self._hits / self._total_requests * 100) if self._total_requests > 0 else 0
        
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "hits": self._hits,
            "misses": self._misses,
            "evictions": self._evictions,
            "total_requests": self._total_requests,
            "hit_rate": round(hit_rate, 2),
            "default_ttl": self.default_ttl
        }
    
    async def get_info(self) -> Dict[str, Any]:
        """
        Get detailed cache information
        
        Returns:
            Dictionary with detailed cache info
        """
        stats = self.get_stats()
        expired_count = await self.cleanup_expired()
        
        return {
            **stats,
            "expired_entries_cleaned": expired_count,
            "memory_usage_estimate": len(self._cache) * 1024  # Rough estimate
        }


class CacheManager:
    """
    Global cache manager for different cache types
    """
    
    def __init__(self):
        # Market prediction cache (5 minutes TTL)
        self.market_predictions = TTLCache(
            max_size=100,      # Store up to 100 predictions
            default_ttl=300    # 5 minutes
        )
        
        # Price data cache (2 minutes TTL)
        self.price_data = TTLCache(
            max_size=500,      # Store up to 500 price entries
            default_ttl=120    # 2 minutes
        )
        
        # Stats cache (1 minute TTL)
        self.stats = TTLCache(
            max_size=200,      # Store up to 200 stats entries
            default_ttl=60     # 1 minute
        )
        
        # News sentiment cache (10 minutes TTL)
        self.sentiment = TTLCache(
            max_size=50,       # Store up to 50 sentiment analyses
            default_ttl=600    # 10 minutes
        )
    
    async def get_all_stats(self) -> Dict[str, Any]:
        """Get statistics for all caches"""
        return {
            "market_predictions": await self.market_predictions.get_info(),
            "price_data": await self.price_data.get_info(),
            "stats": await self.stats.get_info(),
            "sentiment": await self.sentiment.get_info()
        }
    
    async def cleanup_all(self) -> Dict[str, int]:
        """Cleanup expired entries from all caches"""
        return {
            "market_predictions": await self.market_predictions.cleanup_expired(),
            "price_data": await self.price_data.cleanup_expired(),
            "stats": await self.stats.cleanup_expired(),
            "sentiment": await self.sentiment.cleanup_expired()
        }


# Global cache manager instance
cache_manager = CacheManager()


def cache_key_market_prediction(symbol: str = "BTC", enhanced: bool = True) -> str:
    """Generate cache key for market predictions"""
    return f"market_prediction:{symbol}:{'enhanced' if enhanced else 'basic'}"


def cache_key_price_data(coin_ids: list) -> str:
    """Generate cache key for price data"""
    return f"price_data:{':'.join(sorted(coin_ids))}"


def cache_key_stats(symbol: str = None, time_filter: str = None) -> str:
    """Generate cache key for stats"""
    return f"stats:{symbol or 'all'}:{time_filter or 'today'}"


def cache_key_sentiment(text_hash: str) -> str:
    """Generate cache key for sentiment analysis"""
    return f"sentiment:{text_hash}"


# Cache decorator for easy use
def cached(ttl: int = 300, cache_type: str = "market_predictions"):
    """
    Decorator for caching function results
    
    Args:
        ttl: Time to live in seconds
        cache_type: Type of cache to use
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Get appropriate cache
            cache = getattr(cache_manager, cache_type)
            
            # Try to get from cache
            result = await cache.get(key)
            if result is not None:
                logger.debug(f"Cache HIT for {func.__name__}")
                return result
            
            # Cache miss - execute function
            logger.debug(f"Cache MISS for {func.__name__}")
            result = await func(*args, **kwargs)
            
            # Store in cache
            await cache.set(key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


# Background cleanup task
async def start_cache_cleanup():
    """Start background cache cleanup task"""
    logger.info("Starting cache cleanup task...")
    
    while True:
        try:
            # Cleanup every 5 minutes
            await asyncio.sleep(300)
            
            stats = await cache_manager.cleanup_all()
            total_cleaned = sum(stats.values())
            
            if total_cleaned > 0:
                logger.info(f"Cache cleanup: removed {total_cleaned} expired entries")
                
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")


# Export commonly used items
__all__ = [
    'TTLCache',
    'CacheManager', 
    'cache_manager',
    'cache_key_market_prediction',
    'cache_key_price_data', 
    'cache_key_stats',
    'cache_key_sentiment',
    'cached',
    'start_cache_cleanup'
]
