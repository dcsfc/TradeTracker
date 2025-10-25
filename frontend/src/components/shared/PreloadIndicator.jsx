import { useState, useEffect } from 'react';
import { preloadService } from '../../services/preloadService';

/**
 * Preload Indicator - Shows when data is being preloaded in background
 * Professional UX pattern for data loading states
 */
const PreloadIndicator = () => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  useEffect(() => {
    // Check if preload is in progress
    const checkPreloadStatus = () => {
      if (preloadService.isPreloading) {
        setIsPreloading(true);
        
        // Simulate progress (in real app, you'd track actual progress)
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
              setIsPreloading(false);
            }, 500);
          }
          setPreloadProgress(progress);
        }, 200);
        
        return () => clearInterval(interval);
      }
    };

    const cleanup = checkPreloadStatus();
    return cleanup;
  }, []);

  if (!isPreloading) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-xl">
      <div className="flex items-center space-x-3">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <div>
          <div className="text-sm font-semibold text-slate-200">Loading AI Data</div>
          <div className="text-xs text-slate-400">Preparing market insights...</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
        <div 
          className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${preloadProgress}%` }}
        ></div>
      </div>
      
      <div className="mt-2 text-xs text-slate-400 text-center">
        {Math.round(preloadProgress)}% complete
      </div>
    </div>
  );
};

export default PreloadIndicator;

