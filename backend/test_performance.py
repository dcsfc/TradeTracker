"""
Performance Testing Script
Tests the optimized backend for response times and startup performance
"""

import asyncio
import aiohttp
import time
import json
from typing import List, Dict


class PerformanceTester:
    """Test backend performance improvements"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = {}
    
    async def test_startup_time(self) -> float:
        """Test API startup time"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                # Test root endpoint
                async with session.get(f"{self.base_url}/") as response:
                    if response.status == 200:
                        startup_time = time.time() - start_time
                        self.results['startup_time'] = startup_time
                        print(f"Startup time: {startup_time:.2f}s")
                        return startup_time
                    else:
                        print(f"Startup failed: {response.status}")
                        return -1
        except Exception as e:
            print(f"Startup test failed: {e}")
            return -1
    
    async def test_endpoint_performance(self, endpoint: str, method: str = "GET", data: Dict = None) -> Dict:
        """Test individual endpoint performance"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                if method == "GET":
                    async with session.get(f"{self.base_url}{endpoint}") as response:
                        duration = time.time() - start_time
                        status = response.status
                elif method == "POST":
                    async with session.post(f"{self.base_url}{endpoint}", json=data) as response:
                        duration = time.time() - start_time
                        status = response.status
                else:
                    return {"error": "Unsupported method"}
                
                result = {
                    'endpoint': endpoint,
                    'method': method,
                    'duration': duration,
                    'status': status,
                    'success': status == 200
                }
                
                # Performance thresholds
                if duration < 0.5:
                    result['performance'] = 'excellent'
                elif duration < 1.0:
                    result['performance'] = 'good'
                elif duration < 2.0:
                    result['performance'] = 'acceptable'
                else:
                    result['performance'] = 'slow'
                
                print(f"{method} {endpoint}: {duration:.3f}s ({result['performance']})")
                return result
                
        except Exception as e:
            print(f"{endpoint} test failed: {e}")
            return {"error": str(e)}
    
    async def test_concurrent_requests(self, endpoint: str, num_requests: int = 10) -> Dict:
        """Test concurrent request handling"""
        print(f"Testing {num_requests} concurrent requests to {endpoint}")
        
        start_time = time.time()
        
        async def make_request(session, request_id):
            req_start = time.time()
            try:
                async with session.get(f"{self.base_url}{endpoint}") as response:
                    duration = time.time() - req_start
                    return {
                        'request_id': request_id,
                        'duration': duration,
                        'status': response.status,
                        'success': response.status == 200
                    }
            except Exception as e:
                return {
                    'request_id': request_id,
                    'duration': time.time() - req_start,
                    'status': 0,
                    'success': False,
                    'error': str(e)
                }
        
        async with aiohttp.ClientSession() as session:
            tasks = [make_request(session, i) for i in range(num_requests)]
            results = await asyncio.gather(*tasks)
        
        total_time = time.time() - start_time
        successful_requests = sum(1 for r in results if r['success'])
        avg_duration = sum(r['duration'] for r in results) / len(results)
        
        concurrent_result = {
            'total_requests': num_requests,
            'successful_requests': successful_requests,
            'success_rate': successful_requests / num_requests,
            'total_time': total_time,
            'avg_request_time': avg_duration,
            'requests_per_second': num_requests / total_time
        }
        
        print(f"Concurrent test: {successful_requests}/{num_requests} successful, {concurrent_result['requests_per_second']:.1f} req/s")
        return concurrent_result
    
    async def run_full_test(self):
        """Run comprehensive performance tests"""
        print("Starting Backend Performance Tests")
        print("=" * 50)
        
        # Test startup time
        await self.test_startup_time()
        
        # Test individual endpoints
        endpoints_to_test = [
            ("/", "GET"),
            ("/api/performance", "GET"),
            ("/api/stats", "GET"),
        ]
        
        endpoint_results = []
        for endpoint, method in endpoints_to_test:
            result = await self.test_endpoint_performance(endpoint, method)
            endpoint_results.append(result)
        
        # Test concurrent requests
        concurrent_result = await self.test_concurrent_requests("/api/performance", 5)
        
        # Compile results
        self.results['endpoints'] = endpoint_results
        self.results['concurrent'] = concurrent_result
        
        # Performance summary
        print("\nPerformance Summary")
        print("=" * 50)
        
        if 'startup_time' in self.results:
            startup_time = self.results['startup_time']
            if startup_time < 4.0:
                print(f"Startup: {startup_time:.2f}s (EXCELLENT - < 4s)")
            elif startup_time < 8.0:
                print(f"Startup: {startup_time:.2f}s (GOOD - < 8s)")
            else:
                print(f"Startup: {startup_time:.2f}s (NEEDS IMPROVEMENT - > 8s)")
        
        # Endpoint performance
        for result in endpoint_results:
            if 'duration' in result:
                endpoint = result['endpoint']
                duration = result['duration']
                performance = result.get('performance', 'unknown')
                print(f"{endpoint}: {duration:.3f}s ({performance})")
        
        # Concurrent performance
        if concurrent_result['success_rate'] > 0.9:
            print(f"Concurrent: {concurrent_result['requests_per_second']:.1f} req/s (EXCELLENT)")
        elif concurrent_result['success_rate'] > 0.8:
            print(f"Concurrent: {concurrent_result['requests_per_second']:.1f} req/s (GOOD)")
        else:
            print(f"Concurrent: {concurrent_result['requests_per_second']:.1f} req/s (NEEDS IMPROVEMENT)")
        
        return self.results


async def main():
    """Run performance tests"""
    tester = PerformanceTester()
    results = await tester.run_full_test()
    
    # Save results to file
    with open('performance_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to performance_test_results.json")
    print("Performance optimization complete!")


if __name__ == "__main__":
    asyncio.run(main())
