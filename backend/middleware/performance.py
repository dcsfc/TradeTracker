"""
Performance Monitoring Middleware
Tracks request/response times and logs slow endpoints
"""

import time
import asyncio
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from loguru import logger
import json


class PerformanceMiddleware:
    """Middleware to monitor API performance and log slow requests"""
    
    def __init__(self, app):
        self.app = app
        self.slow_threshold = 0.5  # 500ms warning
        self.very_slow_threshold = 2.0  # 2s error
        self.request_count = 0
        self.total_response_time = 0.0
        
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
            
        request = Request(scope, receive)
        start_time = time.time()
        
        # Track request
        self.request_count += 1
        request_id = self.request_count
        
        # Log request start
        logger.debug(f"Request {request_id}: {request.method} {request.url.path}")
        
        # Process request
        response_sent = False
        response_data = None
        
        async def send_wrapper(message):
            nonlocal response_sent, response_data
            if message["type"] == "http.response.start":
                response_data = {
                    "status": message["status"],
                    "headers": dict(message["headers"])
                }
            elif message["type"] == "http.response.body":
                if not response_sent:
                    response_sent = True
                    await send(message)
            else:
                await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Request {request_id} ERROR: {request.method} {request.url.path} - {str(e)} (took {duration:.3f}s)")
            raise
        
        # Calculate response time
        duration = time.time() - start_time
        self.total_response_time += duration
        
        # Add performance headers
        if response_data:
            response_data["headers"][b"x-response-time"] = f"{duration:.3f}s".encode()
            response_data["headers"][b"x-request-id"] = str(request_id).encode()
        
        # Log performance metrics
        self._log_performance(request, duration, response_data)
        
        # Send response if not already sent
        if not response_sent and response_data:
            await send({
                "type": "http.response.start",
                "status": response_data["status"],
                "headers": list(response_data["headers"].items())
            })
            await send({"type": "http.response.body", "body": b""})
    
    def _log_performance(self, request: Request, duration: float, response_data: dict = None):
        """Log performance metrics with appropriate level"""
        status_code = response_data.get("status", 500) if response_data else 500
        path = request.url.path
        method = request.method
        
        # Create log entry
        log_data = {
            "request_id": self.request_count,
            "method": method,
            "path": path,
            "duration": round(duration, 3),
            "status": status_code,
            "avg_response_time": round(self.total_response_time / self.request_count, 3)
        }
        
        # Determine log level based on performance
        if duration >= self.very_slow_threshold:
            logger.error(f"VERY SLOW: {method} {path} took {duration:.2f}s (status: {status_code})")
        elif duration >= self.slow_threshold:
            logger.warning(f"SLOW: {method} {path} took {duration:.2f}s (status: {status_code})")
        else:
            logger.info(f"Request completed: {method} {path} in {duration:.3f}s (status: {status_code})")
        
        # Log detailed metrics for debugging
        logger.debug(f"Performance metrics: {json.dumps(log_data)}")
    
    def get_stats(self) -> dict:
        """Get current performance statistics"""
        avg_response_time = self.total_response_time / self.request_count if self.request_count > 0 else 0
        
        return {
            "total_requests": self.request_count,
            "total_response_time": round(self.total_response_time, 3),
            "average_response_time": round(avg_response_time, 3),
            "requests_per_second": round(self.request_count / self.total_response_time, 2) if self.total_response_time > 0 else 0
        }


def setup_performance_middleware(app):
    """Setup performance monitoring middleware"""
    middleware = PerformanceMiddleware(app)
    
    # Add middleware to FastAPI app
    @app.middleware("http")
    async def performance_middleware(request: Request, call_next):
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Add response headers
        response.headers["X-Response-Time"] = f"{duration:.3f}s"
        response.headers["X-Request-ID"] = str(int(time.time() * 1000))
        
        # Log performance
        path = request.url.path
        method = request.method
        
        if duration >= 2.0:
            logger.error(f"VERY SLOW: {method} {path} took {duration:.2f}s")
        elif duration >= 0.5:
            logger.warning(f"SLOW: {method} {path} took {duration:.2f}s")
        else:
            logger.info(f"Request: {method} {path} in {duration:.3f}s")
        
        return response
    
    return middleware


# Performance metrics endpoint
async def get_performance_metrics() -> dict:
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
