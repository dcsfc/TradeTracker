from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import asyncio
import time
from datetime import datetime, date
from pathlib import Path
from database import Database
from dotenv import load_dotenv
from middleware.performance import setup_performance_middleware
from utils.cache import cache_manager, start_cache_cleanup

# Load environment variables
load_dotenv()

app = FastAPI(title="Crypto Trade Tracker API")

# Initialize database (will be initialized in startup event)
db = Database()

# Add performance monitoring middleware
setup_performance_middleware(app)

# Add compression middleware for 30-50% bandwidth reduction
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,      # Only compress responses > 1KB
    compresslevel=6        # Balance between speed and compression
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Trade(BaseModel):
    symbol: str
    entryPrice: float
    exitPrice: float
    positionType: str
    pnl: Optional[float] = None
    roi: Optional[float] = None
    rr: Optional[float] = None
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None
    positionSize: Optional[float] = None
    leverage: Optional[float] = None
    fees: Optional[float] = None
    entryFee: Optional[float] = None
    exitFee: Optional[float] = None
    exchange: Optional[str] = None
    amountInvested: Optional[float] = None
    tradeResult: Optional[str] = None
    notes: Optional[str] = None

class TradeResponse(BaseModel):
    symbol: str
    pnl: float
    rr: Optional[float] = None
    roi: Optional[float] = None
    entryPrice: float
    exitPrice: float
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None
    positionSize: Optional[float] = None
    leverage: Optional[float] = None
    fees: Optional[float] = None
    entryFee: Optional[float] = None
    exitFee: Optional[float] = None
    exchange: Optional[str] = None
    positionType: str
    date: str
    amountInvested: Optional[float] = None
    tradeResult: Optional[str] = None
    notes: Optional[str] = None

class StatsResponse(BaseModel):
    today_pnl: float
    total_trades: int
    win_rate_long: float
    lose_rate_long: float
    win_rate_short: float
    lose_rate_short: float
    win_rate: float
    lose_rate: float
    wins: int
    losses: int
    trades: List[TradeResponse]

# File paths
DATA_FILE = Path("data.json")

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database and run background tasks"""
    print("🚀 Starting Crypto Trade Tracker API...")
    start_time = time.time()

    # Initialize database
    await db.init_database()
    print("✅ Database initialized")

    # Run migration in background (non-blocking)
    asyncio.create_task(db.migrate_from_json())
    print("🔄 JSON migration started in background")

    # Start cache cleanup task
    asyncio.create_task(start_cache_cleanup())
    print("💾 Cache cleanup task started")

    startup_duration = time.time() - start_time
    print(f"⚡ Startup completed in {startup_duration:.2f}s")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🛑 Shutting down Crypto Trade Tracker API...")

# Legacy functions removed - now using database only

@app.get("/")
async def root():
    return {"message": "Crypto Trade Tracker API"}

@app.get("/api/performance")
async def get_performance_metrics():
    """Get current performance metrics"""
    return {
        "status": "active",
        "monitoring": {
            "slow_threshold_ms": 500,
            "very_slow_threshold_ms": 2000,
            "features": [
                "request_timing",
                "slow_endpoint_detection",
                "response_headers",
                "performance_logging"
            ]
        },
        "note": "Performance monitoring is active. Check logs for detailed metrics."
    }

@app.get("/api/cache-stats")
async def get_cache_stats():
    """Get cache performance statistics"""
    try:
        stats = await cache_manager.get_all_stats()
        return {
            "status": "active",
            "cache_performance": stats,
            "summary": {
                "total_caches": len(stats),
                "overall_hit_rate": round(
                    sum(cache.get('hit_rate', 0) for cache in stats.values()) / len(stats), 2
                ) if stats else 0,
                "total_entries": sum(cache.get('size', 0) for cache in stats.values()),
                "memory_usage_estimate": sum(cache.get('memory_usage_estimate', 0) for cache in stats.values())
            },
            "recommendations": [
                "Hit rate > 70% is excellent",
                "Hit rate 50-70% is good", 
                "Hit rate < 50% indicates cache may need tuning",
                "Monitor evictions to adjust cache size if needed"
            ]
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to retrieve cache statistics"
        }

@app.post("/api/add_trade", response_model=TradeResponse)
async def add_trade(trade: Trade):
    """Add a new trade with today's date"""
    try:
        # Calculate PnL and ROI
        entry_price = trade.entryPrice
        exit_price = trade.exitPrice
        position_type = trade.positionType
        
        # Calculate PnL based on position type
        if position_type.lower() == 'long':
            pnl = exit_price - entry_price
        else:  # short
            pnl = entry_price - exit_price
        
        # Calculate Risk/Reward ratio
        # RR = Potential Profit / Potential Loss
        # For Long: RR = (Exit - Entry) / (Entry - Stop Loss)
        # For Short: RR = (Entry - Exit) / (Stop Loss - Entry)
        # Since we don't have stop loss, we'll use a simplified RR calculation
        # RR = |PnL| / Entry Price (simplified version)
        rr = abs(pnl) / entry_price if entry_price > 0 else 0
        
        # Create new trade with today's date
        new_trade = {
            "symbol": trade.symbol.upper(),
            "pnl": trade.pnl if trade.pnl is not None else 0.0,
            "rr": trade.rr,
            "roi": trade.roi,
            "entryPrice": entry_price,
            "exitPrice": exit_price,
            "stopLoss": trade.stopLoss,
            "takeProfit": trade.takeProfit,
            "positionSize": trade.positionSize,
            "leverage": trade.leverage if trade.leverage is not None else 1.0,
            "fees": trade.fees if trade.fees is not None else 0.0,
            "entryFee": trade.entryFee,
            "exitFee": trade.exitFee,
            "exchange": trade.exchange,
            "positionType": position_type,
            "date": date.today().strftime("%Y-%m-%d"),
            "amountInvested": trade.amountInvested,
            "tradeResult": trade.tradeResult,
            "notes": trade.notes
        }
        
        # Add to database
        trade_id = await db.add_trade(new_trade)
        new_trade["id"] = trade_id
        
        return TradeResponse(**new_trade)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding trade: {str(e)}")

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(symbol: Optional[str] = None, all_time: Optional[bool] = None):
    """Get trading statistics, optionally filtered by symbol and time period"""
    try:
        # Get trades from database
        if all_time:
            # Get all trades
            trades = await db.get_trades(symbol)
        else:
            # Get today's trades only
            today = date.today().strftime("%Y-%m-%d")
            trades = await db.get_trades(symbol, today)
        
        # Calculate stats
        stats = await db.get_stats(symbol, None if all_time else date.today().strftime("%Y-%m-%d"))
        
        # Convert trades to response format (handle both old and new formats)
        trade_responses = []
        for trade in trades:
            # Handle old format (with rr field)
            if 'rr' in trade and 'roi' not in trade:
                trade_response = TradeResponse(
                    symbol=trade.get('symbol', ''),
                    pnl=trade.get('pnl', 0),
                    rr=trade.get('rr', 0.0),  # Use existing RR for old trades
                    roi=None,  # No ROI for old trades
                    entryPrice=0.0,  # Default entry price for old trades
                    exitPrice=0.0,  # Default exit price for old trades
                    stopLoss=None,
                    takeProfit=None,
                    positionSize=None,
                    leverage=None,
                    fees=None,
                    entryFee=None,
                    exitFee=None,
                    exchange=None,
                    positionType='Long',  # Default position type for old trades
                    date=trade.get('date', ''),
                    amountInvested=None,
                    tradeResult=None
                )
            else:
                # Handle new format
                trade_response = TradeResponse(
                    symbol=trade.get('symbol', ''),
                    pnl=trade.get('pnl', 0),
                    rr=trade.get('rr'),
                    roi=trade.get('roi'),
                    entryPrice=trade.get('entryPrice', 0.0),
                    exitPrice=trade.get('exitPrice', 0.0),
                    stopLoss=trade.get('stopLoss'),
                    takeProfit=trade.get('takeProfit'),
                    positionSize=trade.get('positionSize'),
                    leverage=trade.get('leverage'),
                    fees=trade.get('fees'),
                    entryFee=trade.get('entryFee'),
                    exitFee=trade.get('exitFee'),
                    exchange=trade.get('exchange'),
                    positionType=trade.get('positionType', 'Long'),
                    date=trade.get('date', ''),
                    amountInvested=trade.get('amountInvested'),
                    tradeResult=trade.get('tradeResult')
                )
            trade_responses.append(trade_response)
        
        return StatsResponse(
            today_pnl=stats["today_pnl"],
            total_trades=stats["total_trades"],
            win_rate_long=stats["win_rate_long"],
            lose_rate_long=stats["lose_rate_long"],
            win_rate_short=stats["win_rate_short"],
            lose_rate_short=stats["lose_rate_short"],
            win_rate=stats["win_rate"],
            lose_rate=stats["lose_rate"],
            wins=stats["wins"],
            losses=stats["losses"],
            trades=trade_responses
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

@app.put("/api/update_trade/{trade_id}")
async def update_trade(trade_id: int, trade_data: dict):
    """Update an existing trade"""
    try:
        # Update the trade in database
        await db.update_trade(trade_id, trade_data)
        
        return {"message": "Trade updated successfully", "trade": trade_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating trade: {str(e)}")

@app.delete("/api/delete_trade/{trade_id}")
async def delete_trade(trade_id: int):
    """Delete a trade"""
    try:
        # Delete the trade from database
        await db.delete_trade(trade_id)
        
        return {"message": "Trade deleted successfully", "trade_id": trade_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting trade: {str(e)}")

# Import and register market prediction router
from routes.market_prediction import router as market_prediction_router
app.include_router(market_prediction_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
