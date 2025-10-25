import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { preloadService } from './services/preloadService';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PreloadIndicator from './components/shared/PreloadIndicator';
import Dashboard from './pages/Dashboard';
import AddTrade from './pages/AddTrade';
import AIPrediction from './pages/AIPrediction';
import BreakoutStrategy from './pages/BreakoutStrategy';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Start preloading data immediately when app starts
  useEffect(() => {
    console.log('🚀 App started - beginning data preload...');
    preloadService.startPreloading();
  }, []);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handlePageSelect = (pageId) => {
    // Navigate to the appropriate route
    switch (pageId) {
      case 'dashboard':
        navigate('/');
        break;
      case 'add-trade':
        navigate('/add-trade');
        break;
      case 'ai-prediction':
        navigate('/ai-prediction');
        break;
      case 'breakout-strategy':
        navigate('/breakout-strategy');
        break;
      default:
        navigate('/');
    }
    setSidebarOpen(false);
  };

  // Get current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
        return 'dashboard';
      case '/add-trade':
        return 'add-trade';
      case '/ai-prediction':
        return 'ai-prediction';
      case '/breakout-strategy':
        return 'breakout-strategy';
      default:
        return 'dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-trading-dark">
      <Header onMenuClick={handleMenuClick} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        onSelect={handlePageSelect}
        currentPage={getCurrentPage()}
      />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-trade" element={<AddTrade />} />
          <Route path="/ai-prediction" element={<AIPrediction />} />
          <Route path="/breakout-strategy" element={<BreakoutStrategy />} />
          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
      
      {/* Preload indicator for background data loading */}
      <PreloadIndicator />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;