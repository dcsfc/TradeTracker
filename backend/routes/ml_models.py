"""
ML Models Module - Deep Learning and Ensemble Prediction
"""

import torch
import asyncio
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
from typing import Dict, List, Tuple
import joblib
import os
from loguru import logger


class CryptoGRUModel(nn.Module):
    """GRU-based time series prediction model"""
    
    def __init__(self, input_size=20, hidden_size=128, num_layers=2, dropout=0.2):
        super(CryptoGRUModel, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # GRU layers
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # Attention mechanism
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size,
            num_heads=4,
            batch_first=True
        )
        
        # Fully connected layers
        self.fc1 = nn.Linear(hidden_size, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 1)
        
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x):
        # x shape: (batch, seq_len, features)
        gru_out, _ = self.gru(x)
        
        # Apply self-attention
        attn_out, _ = self.attention(gru_out, gru_out, gru_out)
        
        # Take last time step
        out = attn_out[:, -1, :]
        
        # Fully connected layers
        out = self.relu(self.fc1(out))
        out = self.dropout(out)
        out = self.relu(self.fc2(out))
        out = self.dropout(out)
        out = self.fc3(out)
        
        return out


class EnsemblePredictor:
    """Ensemble prediction system combining multiple models"""
    
    def __init__(self):
        self.gru_model = None
        self.xgb_model = None
        self.rf_model = None
        self.scaler = StandardScaler()
        
        # Model weights (can be tuned based on validation performance)
        self.weights = {
            'gru': 0.35,
            'xgboost': 0.30,
            'random_forest': 0.20,
            'sentiment': 0.15
        }
        
        self.is_trained = False
        self._models_loaded = False
        self._loading_models = False
    
    async def _load_models_async(self):
        """Load pre-trained models asynchronously if available"""
        if self._models_loaded:
            return
        
        if self._loading_models:
            # Wait for another request that's already loading models
            while self._loading_models:
                await asyncio.sleep(0.1)
            return
        
        self._loading_models = True
        try:
            logger.info("Loading ML models (lazy loading)...")
            
            # Load models in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._load_models_sync)
            
            self._models_loaded = True
            logger.info("ML models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading ML models: {e}")
        finally:
            self._loading_models = False
    
    def _load_models_sync(self):
        """Load pre-trained models synchronously (called in thread pool)"""
        try:
            model_dir = 'models'
            if os.path.exists(f'{model_dir}/gru_model.pth'):
                self.gru_model = CryptoGRUModel()
                self.gru_model.load_state_dict(
                    torch.load(f'{model_dir}/gru_model.pth', 
                              map_location=torch.device('cpu'))
                )
                self.gru_model.eval()
                logger.info("Loaded GRU model")
            
            if os.path.exists(f'{model_dir}/xgb_model.pkl'):
                self.xgb_model = joblib.load(f'{model_dir}/xgb_model.pkl')
                logger.info("Loaded XGBoost model")
            
            if os.path.exists(f'{model_dir}/rf_model.pkl'):
                self.rf_model = joblib.load(f'{model_dir}/rf_model.pkl')
                logger.info("Loaded Random Forest model")
            
            if os.path.exists(f'{model_dir}/scaler.pkl'):
                self.scaler = joblib.load(f'{model_dir}/scaler.pkl')
                logger.info("Loaded scaler")
                
            self.is_trained = all([
                self.gru_model is not None,
                self.xgb_model is not None,
                self.rf_model is not None
            ])
            
        except Exception as e:
            logger.warning(f"Could not load models: {e}")
            self.is_trained = False
    
    def prepare_features(self, data: Dict) -> np.ndarray:
        """Prepare feature vector from all data sources"""
        features = []
        
        # Price features
        price_data = data.get('price', {})
        features.extend([
            price_data.get('price_change_24h', 0),
            price_data.get('price_change_7d', 0),
            price_data.get('price_change_30d', 0),
            price_data.get('volume_24h', 0) / 1e9,  # Normalize
            price_data.get('market_cap', 0) / 1e9,
        ])
        
        # Technical indicators
        tech = data.get('technical', {})
        features.extend([
            tech.get('rsi', 50) / 100,  # Normalize to 0-1
            tech.get('macd', 0) / 100,
            tech.get('bb_width', 0),
            tech.get('volatility', 0),
            tech.get('returns_1d', 0),
            tech.get('returns_7d', 0),
            1 if tech.get('trend_signal') == 'bullish' else (-1 if tech.get('trend_signal') == 'bearish' else 0),
            tech.get('signal_strength', 0.5),
        ])
        
        # Sentiment features
        sentiment = data.get('sentiment', {})
        features.extend([
            sentiment.get('news_sentiment', 0),
            sentiment.get('social_sentiment', 0),
            sentiment.get('combined_sentiment', 0),
            sentiment.get('sentiment_volume', 0) / 100,  # Normalize
        ])
        
        # Whale activity
        whale = data.get('whale', {})
        features.extend([
            whale.get('net_flow', 0) / 1e9,  # Normalize
            whale.get('total_transactions', 0) / 100,
            1 if whale.get('whale_sentiment') == 'accumulating' else (-1 if whale.get('whale_sentiment') == 'distributing' else 0),
        ])
        
        return np.array(features).reshape(1, -1)
    
    async def predict(self, features_dict: Dict) -> Dict:
        """Generate ensemble prediction"""
        try:
            # Load models if not already loaded
            await self._load_models_async()
            
            # Prepare features
            features = self.prepare_features(features_dict)
            
            # Get sentiment-based prediction (always available)
            sentiment_pred = self._sentiment_based_prediction(features_dict)
            
            if not self.is_trained:
                # Return sentiment-only prediction if models not trained
                return {
                    'prediction': sentiment_pred['prediction'],
                    'confidence': sentiment_pred['confidence'],
                    'direction': sentiment_pred['direction'],
                    'prediction_range': sentiment_pred['prediction_range'],
                    'model_status': 'sentiment_only'
                }
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Get predictions from each model
            predictions = {}
            
            # XGBoost prediction
            if self.xgb_model:
                xgb_pred = self.xgb_model.predict(features_scaled)[0]
                predictions['xgboost'] = xgb_pred
            
            # Random Forest prediction
            if self.rf_model:
                rf_pred = self.rf_model.predict(features_scaled)[0]
                predictions['random_forest'] = rf_pred
            
            # GRU prediction (if we have sequence data)
            if self.gru_model and 'sequence' in features_dict:
                gru_pred = self._gru_prediction(features_dict['sequence'])
                predictions['gru'] = gru_pred
            
            # Sentiment prediction
            predictions['sentiment'] = sentiment_pred['prediction']
            
            # Weighted ensemble
            ensemble_pred = sum(
                predictions.get(model, 0) * weight
                for model, weight in self.weights.items()
                if model in predictions
            )
            
            # Calculate confidence from prediction variance
            pred_values = list(predictions.values())
            pred_variance = np.var(pred_values) if len(pred_values) > 1 else 0.1
            confidence = 1 / (1 + pred_variance)
            
            # Determine direction
            if ensemble_pred > 2:
                direction = 'strong_bullish'
            elif ensemble_pred > 0:
                direction = 'bullish'
            elif ensemble_pred < -2:
                direction = 'strong_bearish'
            elif ensemble_pred < 0:
                direction = 'bearish'
            else:
                direction = 'neutral'
            
            # Calculate prediction range (95% confidence interval)
            pred_std = np.std(pred_values) if len(pred_values) > 1 else 1.0
            prediction_range = (
                ensemble_pred - 1.96 * pred_std,
                ensemble_pred + 1.96 * pred_std
            )
            
            return {
                'prediction': float(ensemble_pred),
                'confidence': float(confidence),
                'direction': direction,
                'prediction_range': prediction_range,
                'individual_predictions': predictions,
                'model_status': 'ensemble_active'
            }
            
        except Exception as e:
            logger.error(f"Ensemble prediction error: {e}")
            return self._sentiment_based_prediction(features_dict)
    
    def _sentiment_based_prediction(self, data: Dict) -> Dict:
        """Fallback prediction using sentiment only"""
        sentiment = data.get('sentiment', {})
        whale = data.get('whale', {})
        tech = data.get('technical', {})
        
        # Combine signals
        sentiment_score = sentiment.get('combined_sentiment', 0)
        whale_score = 1 if whale.get('whale_sentiment') == 'accumulating' else (
            -1 if whale.get('whale_sentiment') == 'distributing' else 0
        )
        tech_score = 1 if tech.get('trend_signal') == 'bullish' else (
            -1 if tech.get('trend_signal') == 'bearish' else 0
        )
        
        # Weighted combination
        combined_score = (
            sentiment_score * 0.4 +
            whale_score * 0.3 +
            tech_score * 0.3
        )
        
        # Determine direction
        if combined_score > 0.3:
            direction = 'bullish'
            confidence = min(0.7, 0.5 + abs(combined_score) * 0.2)
        elif combined_score < -0.3:
            direction = 'bearish'
            confidence = min(0.7, 0.5 + abs(combined_score) * 0.2)
        else:
            direction = 'neutral'
            confidence = 0.5
        
        return {
            'prediction': combined_score,
            'confidence': confidence,
            'direction': direction,
            'prediction_range': (combined_score - 0.5, combined_score + 0.5),
            'model_status': 'sentiment_based'
        }
    
    def _gru_prediction(self, sequence_data: np.ndarray) -> float:
        """Get prediction from GRU model"""
        try:
            with torch.no_grad():
                sequence_tensor = torch.FloatTensor(sequence_data).unsqueeze(0)
                prediction = self.gru_model(sequence_tensor)
                return float(prediction.item())
        except Exception as e:
            logger.error(f"GRU prediction error: {e}")
            return 0.0


# Singleton instance
ensemble_predictor = EnsemblePredictor()