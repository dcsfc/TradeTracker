/**
 * LoadingState Component
 * Skeleton loader that matches the dashboard layout
 * Provides better UX during data fetching (prevents blank screen)
 */
const LoadingState = () => {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 bg-slate-800 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/4 mb-8"></div>
          </div>

          {/* Insights Banner Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="h-24 bg-slate-800 rounded-lg"></div>
            <div className="h-24 bg-slate-800 rounded-lg"></div>
            <div className="h-24 bg-slate-800 rounded-lg"></div>
          </div>

          {/* Price Chart Skeleton */}
          <div className="mb-8">
            <div className="h-96 bg-slate-800 rounded-xl"></div>
          </div>

          {/* Metric Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-32 bg-slate-800 rounded-xl"></div>
              </div>
            ))}
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="h-96 bg-slate-800 rounded-xl"></div>
            </div>
            {/* Sidebar */}
            <div>
              <div className="h-96 bg-slate-800 rounded-xl"></div>
            </div>
          </div>

          {/* News Section Skeleton */}
          <div className="mt-8">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;

