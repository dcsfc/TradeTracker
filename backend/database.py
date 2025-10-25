import aiosqlite
import json
from datetime import datetime
from pathlib import Path
import asyncio

class Database:
    def __init__(self, db_path="trades.db"):
        self.db_path = db_path
        # Don't initialize synchronously - will be done in startup event
    
    async def init_database(self):
        """Initialize the database with required tables"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
        
            await cursor.execute('''
                CREATE TABLE IF NOT EXISTS trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT NOT NULL,
                    entry_price REAL NOT NULL,
                    exit_price REAL NOT NULL,
                    position_type TEXT NOT NULL,
                    pnl REAL,
                    roi REAL,
                    rr REAL,
                    stop_loss REAL,
                    take_profit REAL,
                    position_size REAL,
                    leverage REAL,
                    fees REAL,
                    entry_fee REAL,
                    exit_fee REAL,
                    exchange TEXT,
                    base_currency TEXT,
                    amount_invested REAL,
                    trade_result TEXT,
                    crypto_quantity REAL,
                    notes TEXT,
                    date TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create market predictions table for AI sentiment history
            await cursor.execute('''
                CREATE TABLE IF NOT EXISTS market_predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    prediction TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    sentiment_score REAL NOT NULL,
                    summary TEXT NOT NULL,
                    articles_analyzed INTEGER NOT NULL,
                    positive_pct REAL,
                    negative_pct REAL,
                    neutral_pct REAL,
                    top_coins TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            await conn.commit()
    
    async def migrate_from_json(self, json_file_path="data.json"):
        """Migrate existing JSON data to SQLite (async)"""
        if not Path(json_file_path).exists():
            return
        
        # Check if backup already exists (migration already done)
        backup_path = Path(f"{json_file_path}.backup")
        if backup_path.exists():
            print(f"Migration already completed. Backup file exists: {backup_path}")
            return
        
        # Load existing JSON data asynchronously (non-blocking)
        def _load_json():
            with open(json_file_path, 'r') as f:
                return json.load(f)
        
        trades = await asyncio.to_thread(_load_json)
        
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            for trade in trades:
                await cursor.execute('''
                    INSERT INTO trades (
                        symbol, entry_price, exit_price, position_type, pnl, roi, rr,
                        stop_loss, take_profit, position_size, leverage, fees, entry_fee,
                        exit_fee, exchange, base_currency, amount_invested, trade_result,
                        crypto_quantity, notes, date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    trade.get('symbol'),
                    trade.get('entryPrice'),
                    trade.get('exitPrice'),
                    trade.get('positionType'),
                    trade.get('pnl'),
                    trade.get('roi'),
                    trade.get('rr'),
                    trade.get('stopLoss'),
                    trade.get('takeProfit'),
                    trade.get('positionSize'),
                    trade.get('leverage'),
                    trade.get('fees'),
                    trade.get('entryFee'),
                    trade.get('exitFee'),
                    trade.get('exchange'),
                    trade.get('baseCurrency'),
                    trade.get('amountInvested'),
                    trade.get('tradeResult'),
                    trade.get('cryptoQuantity'),
                    trade.get('notes'),
                    trade.get('date')
                ))
            
            await conn.commit()
        
        # Backup original JSON file
        Path(json_file_path).rename(backup_path)
        print(f"JSON data migrated to SQLite. Original file backed up as {backup_path}")
    
    async def get_trades(self, symbol=None, date=None):
        """Get trades with optional filtering"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            query = "SELECT * FROM trades"
            params = []
            
            if symbol:
                query += " WHERE symbol = ?"
                params.append(symbol)
            
            if date:
                query += " AND date = ?" if symbol else " WHERE date = ?"
                params.append(date)
            
            query += " ORDER BY created_at DESC"
            
            await cursor.execute(query, params)
            columns = [description[0] for description in cursor.description]
            trades = [dict(zip(columns, row)) for row in await cursor.fetchall()]
            
            return trades
    
    async def add_trade(self, trade_data):
        """Add a new trade"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            await cursor.execute('''
                INSERT INTO trades (
                    symbol, entry_price, exit_price, position_type, pnl, roi, rr,
                    stop_loss, take_profit, position_size, leverage, fees, entry_fee,
                    exit_fee, exchange, base_currency, amount_invested, trade_result,
                    crypto_quantity, notes, date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                trade_data.get('symbol'),
                trade_data.get('entryPrice'),
                trade_data.get('exitPrice'),
                trade_data.get('positionType'),
                trade_data.get('pnl'),
                trade_data.get('roi'),
                trade_data.get('rr'),
                trade_data.get('stopLoss'),
                trade_data.get('takeProfit'),
                trade_data.get('positionSize'),
                trade_data.get('leverage'),
                trade_data.get('fees'),
                trade_data.get('entryFee'),
                trade_data.get('exitFee'),
                trade_data.get('exchange'),
                trade_data.get('baseCurrency'),
                trade_data.get('amountInvested'),
                trade_data.get('tradeResult'),
                trade_data.get('cryptoQuantity'),
                trade_data.get('notes'),
                trade_data.get('date')
            ))
            
            trade_id = cursor.lastrowid
            await conn.commit()
            
            return trade_id
    
    async def update_trade(self, trade_id, trade_data):
        """Update an existing trade"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            # Build dynamic update query
            set_clauses = []
            params = []
            
            for key, value in trade_data.items():
                if key in ['symbol', 'entryPrice', 'exitPrice', 'positionType', 'pnl', 'roi', 'rr',
                          'stopLoss', 'takeProfit', 'positionSize', 'leverage', 'fees', 'entryFee',
                          'exitFee', 'exchange', 'baseCurrency', 'amountInvested', 'tradeResult',
                          'cryptoQuantity', 'notes', 'date']:
                    set_clauses.append(f"{key} = ?")
                    params.append(value)
            
            if set_clauses:
                params.append(trade_id)
                query = f"UPDATE trades SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                await cursor.execute(query, params)
                await conn.commit()
    
    async def delete_trade(self, trade_id):
        """Delete a trade"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            await cursor.execute("DELETE FROM trades WHERE id = ?", (trade_id,))
            await conn.commit()
    
    async def get_stats(self, symbol=None, date=None):
        """Get trading statistics"""
        trades = await self.get_trades(symbol, date)
        
        if not trades:
            return {
                'today_pnl': 0,
                'total_trades': 0,
                'wins': 0,
                'losses': 0,
                'win_rate': 0,
                'lose_rate': 0,
                'win_rate_long': 0,
                'lose_rate_long': 0,
                'win_rate_short': 0,
                'lose_rate_short': 0,
                'trades': []
            }
        
        # Calculate basic stats
        total_pnl = sum(trade.get('pnl', 0) or 0 for trade in trades)
        wins = len([t for t in trades if (t.get('pnl', 0) or 0) > 0])
        losses = len([t for t in trades if (t.get('pnl', 0) or 0) < 0])
        total_trades = len(trades)
        
        win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
        lose_rate = (losses / total_trades * 100) if total_trades > 0 else 0
        
        # Long/Short specific stats
        long_trades = [t for t in trades if t.get('positionType', '').lower() == 'long']
        short_trades = [t for t in trades if t.get('positionType', '').lower() == 'short']
        
        long_wins = len([t for t in long_trades if (t.get('pnl', 0) or 0) > 0])
        long_losses = len([t for t in long_trades if (t.get('pnl', 0) or 0) < 0])
        short_wins = len([t for t in short_trades if (t.get('pnl', 0) or 0) > 0])
        short_losses = len([t for t in short_trades if (t.get('pnl', 0) or 0) < 0])
        
        win_rate_long = (long_wins / len(long_trades) * 100) if long_trades else 0
        lose_rate_long = (long_losses / len(long_trades) * 100) if long_trades else 0
        win_rate_short = (short_wins / len(short_trades) * 100) if short_trades else 0
        lose_rate_short = (short_losses / len(short_trades) * 100) if short_trades else 0
        
        return {
            'today_pnl': total_pnl,
            'total_trades': total_trades,
            'wins': wins,
            'losses': losses,
            'win_rate': win_rate,
            'lose_rate': lose_rate,
            'win_rate_long': win_rate_long,
            'lose_rate_long': lose_rate_long,
            'win_rate_short': win_rate_short,
            'lose_rate_short': lose_rate_short,
            'trades': trades
        }
    
    async def save_market_prediction(self, prediction_data):
        """Save a market prediction to the database"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            await cursor.execute('''
                INSERT INTO market_predictions (
                    prediction, confidence, sentiment_score, summary, articles_analyzed,
                    positive_pct, negative_pct, neutral_pct, top_coins
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                prediction_data.get('prediction'),
                prediction_data.get('confidence'),
                prediction_data.get('sentiment_score'),
                prediction_data.get('summary'),
                prediction_data.get('articles_analyzed'),
                prediction_data.get('positive_pct'),
                prediction_data.get('negative_pct'),
                prediction_data.get('neutral_pct'),
                prediction_data.get('top_coins')
            ))
            
            await conn.commit()
    
    async def get_market_predictions_history(self, days=7):
        """Get market prediction history for the last N days"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            await cursor.execute('''
                SELECT * FROM market_predictions 
                WHERE created_at >= datetime('now', '-{} days')
                ORDER BY created_at DESC
            '''.format(days))
            
            columns = [description[0] for description in cursor.description]
            predictions = [dict(zip(columns, row)) for row in await cursor.fetchall()]
            
            return predictions
