from aiosqlitepool import Pool
import json
from datetime import datetime
from pathlib import Path
import asyncio

class Database:
    def __init__(self, db_path="trades.db"):
        self.db_path = db_path
        self.pool: Pool | None = None
        # Don't initialize synchronously - will be done in startup event
    
    async def init_database(self):
        """Initialize the database with required tables"""
        # Initialize connection pool lazily on startup
        if self.pool is None:
            self.pool = Pool(
                self.db_path,
                min_size=2,
                max_size=10,
                timeout=30,
            )
            await self.pool.init()

        async with self.pool.acquire() as conn:
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

            # Helpful index for common query filters
            await cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_trades_symbol_date
                ON trades(symbol, date)
            ''')
            
            await conn.commit()
    
    async def close(self) -> None:
        """Close the connection pool on shutdown"""
        if self.pool is not None:
            await self.pool.close()
            self.pool = None
    
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
        
        async with self.pool.acquire() as conn:
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
    
    async def get_trades(self, symbol=None, date=None, page: int = 1, limit: int = 50):
        """Get trades with optional filtering and pagination"""
        # Sanitize pagination inputs
        page = int(page) if page is not None else 1
        limit = int(limit) if limit is not None else 50
        page = 1 if page < 1 else page
        # Cap limit to prevent excessive memory usage
        if limit < 1:
            limit = 1
        if limit > 200:
            limit = 200
        offset = (page - 1) * limit

        async with self.pool.acquire() as conn:
            cursor = await conn.cursor()
            
            query = "SELECT * FROM trades"
            params = []
            
            if symbol:
                query += " WHERE symbol = ?"
                params.append(symbol)
            
            if date:
                query += " AND date = ?" if symbol else " WHERE date = ?"
                params.append(date)
            
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            await cursor.execute(query, params)
            columns = [description[0] for description in cursor.description]
            trades = [dict(zip(columns, row)) for row in await cursor.fetchall()]
            
            return trades
    
    async def add_trade(self, trade_data):
        """Add a new trade"""
        async with self.pool.acquire() as conn:
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
        async with self.pool.acquire() as conn:
            cursor = await conn.cursor()
            
            # Build dynamic update query
            set_clauses = []
            params = []
            
            # Whitelist mapping from API field names to DB column names
            allowed_fields = {
                'symbol': 'symbol',
                'entryPrice': 'entry_price',
                'exitPrice': 'exit_price',
                'positionType': 'position_type',
                'pnl': 'pnl',
                'roi': 'roi',
                'rr': 'rr',
                'stopLoss': 'stop_loss',
                'takeProfit': 'take_profit',
                'positionSize': 'position_size',
                'leverage': 'leverage',
                'fees': 'fees',
                'entryFee': 'entry_fee',
                'exitFee': 'exit_fee',
                'exchange': 'exchange',
                'baseCurrency': 'base_currency',
                'amountInvested': 'amount_invested',
                'tradeResult': 'trade_result',
                'cryptoQuantity': 'crypto_quantity',
                'notes': 'notes',
                'date': 'date'
            }
            
            for key, value in trade_data.items():
                db_field = allowed_fields.get(key)
                if db_field is not None:
                    set_clauses.append(f"{db_field} = ?")
                    params.append(value)
            
            if set_clauses:
                params.append(trade_id)
                query = f"UPDATE trades SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                await cursor.execute(query, params)
                await conn.commit()
    
    async def delete_trade(self, trade_id):
        """Delete a trade"""
        async with self.pool.acquire() as conn:
            cursor = await conn.cursor()
            
            await cursor.execute("DELETE FROM trades WHERE id = ?", (trade_id,))
            await conn.commit()
    
    async def get_stats(self, symbol=None, date=None, page: int = 1, limit: int = 50):
        """Get trading statistics using SQL aggregations for performance"""
        # Fetch trades list (for UI); could be paginated in future
        trades = await self.get_trades(symbol, date, page=page, limit=limit)

        async with self.pool.acquire() as conn:
            cursor = await conn.cursor()

            where_parts = []
            params = []
            if symbol:
                where_parts.append("symbol = ?")
                params.append(symbol)
            if date:
                where_parts.append("date = ?")
                params.append(date)
            where_clause = (" WHERE " + " AND ".join(where_parts)) if where_parts else ""

            await cursor.execute(
                f'''
                SELECT 
                    COALESCE(SUM(COALESCE(pnl,0)), 0) AS total_pnl,
                    COUNT(*) AS total_trades,
                    SUM(CASE WHEN COALESCE(pnl,0) > 0 THEN 1 ELSE 0 END) AS wins,
                    SUM(CASE WHEN COALESCE(pnl,0) < 0 THEN 1 ELSE 0 END) AS losses,
                    SUM(CASE WHEN LOWER(position_type) = 'long' AND COALESCE(pnl,0) > 0 THEN 1 ELSE 0 END) AS long_wins,
                    SUM(CASE WHEN LOWER(position_type) = 'long' THEN 1 ELSE 0 END) AS long_total,
                    SUM(CASE WHEN LOWER(position_type) = 'short' AND COALESCE(pnl,0) > 0 THEN 1 ELSE 0 END) AS short_wins,
                    SUM(CASE WHEN LOWER(position_type) = 'short' THEN 1 ELSE 0 END) AS short_total
                FROM trades
                {where_clause}
                ''',
                params
            )

            row = await cursor.fetchone()

            if not row:
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

            total_pnl = row[0] or 0
            total_trades = row[1] or 0
            wins = row[2] or 0
            losses = row[3] or 0
            long_wins = row[4] or 0
            long_total = row[5] or 0
            short_wins = row[6] or 0
            short_total = row[7] or 0

            win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
            lose_rate = (losses / total_trades * 100) if total_trades > 0 else 0
            win_rate_long = (long_wins / long_total * 100) if long_total > 0 else 0
            lose_rate_long = ((long_total - long_wins) / long_total * 100) if long_total > 0 else 0
            win_rate_short = (short_wins / short_total * 100) if short_total > 0 else 0
            lose_rate_short = ((short_total - short_wins) / short_total * 100) if short_total > 0 else 0

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
        async with self.pool.acquire() as conn:
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
        async with self.pool.acquire() as conn:
            cursor = await conn.cursor()
            
            # Parameterize interval to avoid string formatting issues
            await cursor.execute(
                '''
                SELECT * FROM market_predictions 
                WHERE created_at >= datetime('now', ?)
                ORDER BY created_at DESC
                ''',
                (f'-{int(days)} days',)
            )
            
            columns = [description[0] for description in cursor.description]
            predictions = [dict(zip(columns, row)) for row in await cursor.fetchall()]
            
            return predictions
