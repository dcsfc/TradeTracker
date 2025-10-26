"""
Database module for Crypto Trade Tracker
Uses aiosqlite for async database operations
"""

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
            with open(json_file_path, 'r', encoding='utf-8') as f:
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
            # Rename the original JSON file to prevent re-migration
            Path(json_file_path).rename(backup_path)
            print(f"JSON data migrated to SQLite. Original file backed up to {backup_path}")

    async def get_trades(self, symbol=None, time_filter=None):
        """Get trades from database with optional filtering"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            query = "SELECT * FROM trades"
            params = []
            
            if symbol and symbol != 'All':
                query += " WHERE symbol = ?"
                params.append(symbol)
            
            if time_filter == 'Today':
                if 'WHERE' in query:
                    query += " AND date(date) = date('now')"
                else:
                    query += " WHERE date(date) = date('now')"
            
            query += " ORDER BY date DESC"
            
            await cursor.execute(query, params)
            rows = await cursor.fetchall()
            
            # Convert to list of dictionaries
            columns = [description[0] for description in cursor.description]
            trades = [dict(zip(columns, row)) for row in rows]
            
            return trades

    async def add_trade(self, trade_data):
        """Add a new trade to the database"""
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
                trade_data.get('entry_price'),
                trade_data.get('exit_price'),
                trade_data.get('position_type'),
                trade_data.get('pnl'),
                trade_data.get('roi'),
                trade_data.get('rr'),
                trade_data.get('stop_loss'),
                trade_data.get('take_profit'),
                trade_data.get('position_size'),
                trade_data.get('leverage'),
                trade_data.get('fees'),
                trade_data.get('entry_fee'),
                trade_data.get('exit_fee'),
                trade_data.get('exchange'),
                trade_data.get('base_currency'),
                trade_data.get('amount_invested'),
                trade_data.get('trade_result'),
                trade_data.get('crypto_quantity'),
                trade_data.get('notes'),
                trade_data.get('date')
            ))
            
            await conn.commit()
            return cursor.lastrowid

    async def update_trade(self, trade_id, trade_data):
        """Update an existing trade"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            await cursor.execute('''
                UPDATE trades SET
                    symbol = ?, entry_price = ?, exit_price = ?, position_type = ?,
                    pnl = ?, roi = ?, rr = ?, stop_loss = ?, take_profit = ?,
                    position_size = ?, leverage = ?, fees = ?, entry_fee = ?,
                    exit_fee = ?, exchange = ?, base_currency = ?, amount_invested = ?,
                    trade_result = ?, crypto_quantity = ?, notes = ?, date = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                trade_data.get('symbol'),
                trade_data.get('entry_price'),
                trade_data.get('exit_price'),
                trade_data.get('position_type'),
                trade_data.get('pnl'),
                trade_data.get('roi'),
                trade_data.get('rr'),
                trade_data.get('stop_loss'),
                trade_data.get('take_profit'),
                trade_data.get('position_size'),
                trade_data.get('leverage'),
                trade_data.get('fees'),
                trade_data.get('entry_fee'),
                trade_data.get('exit_fee'),
                trade_data.get('exchange'),
                trade_data.get('base_currency'),
                trade_data.get('amount_invested'),
                trade_data.get('trade_result'),
                trade_data.get('crypto_quantity'),
                trade_data.get('notes'),
                trade_data.get('date'),
                trade_id
            ))
            
            await conn.commit()
            return cursor.rowcount

    async def delete_trade(self, trade_id):
        """Delete a trade"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            await cursor.execute('DELETE FROM trades WHERE id = ?', (trade_id,))
            await conn.commit()
            return cursor.rowcount

    async def get_stats(self, symbol=None, time_filter=None):
        """Get trading statistics"""
        trades = await self.get_trades(symbol, time_filter)
        
        if not trades:
            return {
                'today_pnl': 0,
                'total_trades': 0,
                'win_rate_long': 0,
                'lose_rate_long': 0,
                'win_rate_short': 0,
                'lose_rate_short': 0,
                'win_rate': 0,
                'lose_rate': 0,
                'wins': 0,
                'losses': 0,
                'trades': []
            }

        # Calculate statistics
        total_trades = len(trades)
        wins = sum(1 for trade in trades if trade.get('pnl', 0) > 0)
        losses = sum(1 for trade in trades if trade.get('pnl', 0) < 0)
        
        win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
        lose_rate = (losses / total_trades * 100) if total_trades > 0 else 0
        
        # Long/Short specific stats
        long_trades = [t for t in trades if t.get('position_type') == 'Long']
        short_trades = [t for t in trades if t.get('position_type') == 'Short']
        
        long_wins = sum(1 for trade in long_trades if trade.get('pnl', 0) > 0)
        long_losses = sum(1 for trade in long_trades if trade.get('pnl', 0) < 0)
        short_wins = sum(1 for trade in short_trades if trade.get('pnl', 0) > 0)
        short_losses = sum(1 for trade in short_trades if trade.get('pnl', 0) < 0)
        
        win_rate_long = (long_wins / len(long_trades) * 100) if long_trades else 0
        lose_rate_long = (long_losses / len(long_trades) * 100) if long_trades else 0
        win_rate_short = (short_wins / len(short_trades) * 100) if short_trades else 0
        lose_rate_short = (short_losses / len(short_trades) * 100) if short_trades else 0
        
        # Today's PnL
        today_pnl = sum(trade.get('pnl', 0) for trade in trades if trade.get('date') == datetime.now().strftime('%Y-%m-%d'))
        
        return {
            'today_pnl': today_pnl,
            'total_trades': total_trades,
            'win_rate_long': win_rate_long,
            'lose_rate_long': lose_rate_long,
            'win_rate_short': win_rate_short,
            'lose_rate_short': lose_rate_short,
            'win_rate': win_rate,
            'lose_rate': lose_rate,
            'wins': wins,
            'losses': losses,
            'trades': trades
        }

    async def save_market_prediction(self, prediction, confidence, sentiment_score, summary, articles_analyzed, positive_pct=None, negative_pct=None, neutral_pct=None, top_coins=None):
        """Save market prediction to database"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            await cursor.execute('''
                INSERT INTO market_predictions (
                    prediction, confidence, sentiment_score, summary, articles_analyzed,
                    positive_pct, negative_pct, neutral_pct, top_coins
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                prediction, confidence, sentiment_score, summary, articles_analyzed,
                positive_pct, negative_pct, neutral_pct, json.dumps(top_coins) if top_coins else None
            ))
            
            await conn.commit()
            return cursor.lastrowid

    async def get_market_predictions_history(self, limit=10):
        """Get market prediction history"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.cursor()
            
            await cursor.execute('''
                SELECT * FROM market_predictions 
                ORDER BY created_at DESC 
                LIMIT ?
            ''', (limit,))
            
            rows = await cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            predictions = [dict(zip(columns, row)) for row in rows]
            
            return predictions
