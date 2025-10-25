"""
Technical Indicators Module - Calculate market indicators
"""

import pandas as pd
import numpy as np
import ta
from typing import Dict, List
from loguru import logger


class TechnicalAnalyzer:
    """Calculate and analyze technical indicators"""
    
    def __init__(self):
        pass
    
    def calculate_all_indicators(self, price_data: Dict) -> Dict:
        """Calculate comprehensive technical indicators"""
        try:
            # Convert to DataFrame
            df = pd.DataFrame({
                'timestamp': price_data.get('timestamps', []),
                'open': price_data.get('open', []),
                'high': price_data.get('high', []),
                'low': price_data.get('low', []),
                'close': price_data.get('close', []),
                'volume': price_data.get('volume', [0] * len(price_data.get('close', [])))
            })
            
            if df.empty or len(df) < 20:
                return self._get_mock_indicators()
            
            # Trend Indicators
            df['sma_20'] = ta.trend.sma_indicator(df['close'], window=20)
            df['sma_50'] = ta.trend.sma_indicator(df['close'], window=50)
            df['ema_12'] = ta.trend.ema_indicator(df['close'], window=12)
            df['ema_26'] = ta.trend.ema_indicator(df['close'], window=26)
            df['macd'] = ta.trend.macd_diff(df['close'])
            
            # Momentum Indicators
            df['rsi'] = ta.momentum.rsi(df['close'], window=14)
            df['stoch'] = ta.momentum.stoch(df['high'], df['low'], df['close'])
            
            # Volatility Indicators
            bollinger = ta.volatility.BollingerBands(df['close'])
            df['bb_upper'] = bollinger.bollinger_hband()
            df['bb_lower'] = bollinger.bollinger_lband()
            df['bb_width'] = bollinger.bollinger_wband()
            df['atr'] = ta.volatility.average_true_range(df['high'], df['low'], df['close'])
            
            # Volume Indicators
            if df['volume'].sum() > 0:
                df['obv'] = ta.volume.on_balance_volume(df['close'], df['volume'])
                df['vwap'] = ta.volume.volume_weighted_average_price(
                    df['high'], df['low'], df['close'], df['volume']
                )
            else:
                df['obv'] = 0
                df['vwap'] = df['close']
            
            # Custom Volatility
            df['volatility'] = df['close'].pct_change().rolling(14).std()
            df['returns_1d'] = df['close'].pct_change()
            df['returns_7d'] = df['close'].pct_change(7)
            
            # Get latest values
            latest = df.iloc[-1]
            
            # Generate signals
            signals = self._generate_signals(df)
            
            return {
                # Trend
                'sma_20': float(latest['sma_20']) if not pd.isna(latest['sma_20']) else 0,
                'sma_50': float(latest['sma_50']) if not pd.isna(latest['sma_50']) else 0,
                'ema_12': float(latest['ema_12']) if not pd.isna(latest['ema_12']) else 0,
                'macd': float(latest['macd']) if not pd.isna(latest['macd']) else 0,
                
                # Momentum
                'rsi': float(latest['rsi']) if not pd.isna(latest['rsi']) else 50,
                'stoch': float(latest['stoch']) if not pd.isna(latest['stoch']) else 50,
                
                # Volatility
                'bb_upper': float(latest['bb_upper']) if not pd.isna(latest['bb_upper']) else 0,
                'bb_lower': float(latest['bb_lower']) if not pd.isna(latest['bb_lower']) else 0,
                'bb_width': float(latest['bb_width']) if not pd.isna(latest['bb_width']) else 0,
                'atr': float(latest['atr']) if not pd.isna(latest['atr']) else 0,
                'volatility': float(latest['volatility']) if not pd.isna(latest['volatility']) else 0,
                
                # Volume
                'obv': float(latest['obv']) if not pd.isna(latest['obv']) else 0,
                'vwap': float(latest['vwap']) if not pd.isna(latest['vwap']) else 0,
                
                # Returns
                'returns_1d': float(latest['returns_1d']) if not pd.isna(latest['returns_1d']) else 0,
                'returns_7d': float(latest['returns_7d']) if not pd.isna(latest['returns_7d']) else 0,
                
                # Signals
                **signals
            }
            
        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            return self._get_mock_indicators()
    
    def _generate_signals(self, df: pd.DataFrame) -> Dict:
        """Generate trading signals from indicators"""
        latest = df.iloc[-1]
        prev = df.iloc[-2] if len(df) > 1 else latest
        
        signals = {
            'trend_signal': 'neutral',
            'momentum_signal': 'neutral',
            'volatility_signal': 'normal',
            'volume_signal': 'neutral',
            'overall_signal': 'neutral',
            'signal_strength': 0.5
        }
        
        signal_score = 0
        
        # Trend Analysis
        if not pd.isna(latest['sma_20']) and not pd.isna(latest['sma_50']):
            if latest['sma_20'] > latest['sma_50']:
                signals['trend_signal'] = 'bullish'
                signal_score += 1
            elif latest['sma_20'] < latest['sma_50']:
                signals['trend_signal'] = 'bearish'
                signal_score -= 1
        
        # Momentum Analysis
        if not pd.isna(latest['rsi']):
            if latest['rsi'] > 70:
                signals['momentum_signal'] = 'overbought'
                signal_score -= 0.5
            elif latest['rsi'] < 30:
                signals['momentum_signal'] = 'oversold'
                signal_score += 0.5
            elif 40 < latest['rsi'] < 60:
                signals['momentum_signal'] = 'neutral'
        
        # MACD Analysis
        if not pd.isna(latest['macd']) and not pd.isna(prev['macd']):
            if latest['macd'] > 0 and prev['macd'] <= 0:
                signal_score += 1  # Bullish crossover
            elif latest['macd'] < 0 and prev['macd'] >= 0:
                signal_score -= 1  # Bearish crossover
        
        # Volatility Analysis
        if not pd.isna(latest['bb_width']):
            bb_width_percentile = (latest['bb_width'] / df['bb_width'].quantile(0.75))
            if bb_width_percentile > 1.2:
                signals['volatility_signal'] = 'high'
            elif bb_width_percentile < 0.8:
                signals['volatility_signal'] = 'low'
        
        # Overall Signal
        if signal_score > 1:
            signals['overall_signal'] = 'strong_bullish'
            signals['signal_strength'] = min(0.9, 0.5 + (signal_score * 0.1))
        elif signal_score > 0:
            signals['overall_signal'] = 'bullish'
            signals['signal_strength'] = 0.5 + (signal_score * 0.1)
        elif signal_score < -1:
            signals['overall_signal'] = 'strong_bearish'
            signals['signal_strength'] = max(0.1, 0.5 + (signal_score * 0.1))
        elif signal_score < 0:
            signals['overall_signal'] = 'bearish'
            signals['signal_strength'] = 0.5 + (signal_score * 0.1)
        
        return signals
    
    def _get_mock_indicators(self) -> Dict:
        """Return mock indicators when calculation fails"""
        return {
            'sma_20': 0, 'sma_50': 0, 'ema_12': 0, 'macd': 0,
            'rsi': 50, 'stoch': 50,
            'bb_upper': 0, 'bb_lower': 0, 'bb_width': 0, 'atr': 0, 'volatility': 0,
            'obv': 0, 'vwap': 0,
            'returns_1d': 0, 'returns_7d': 0,
            'trend_signal': 'neutral', 'momentum_signal': 'neutral',
            'volatility_signal': 'normal', 'volume_signal': 'neutral',
            'overall_signal': 'neutral', 'signal_strength': 0.5,
            'mock': True
        }


# Singleton instance
technical_analyzer = TechnicalAnalyzer()