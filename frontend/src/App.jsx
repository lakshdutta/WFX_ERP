import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import NLQuery from './components/NLQuery';
import ProductSearch from './components/ProductSearch';
import ImageSearch from './components/ImageSearch';
import GoodsExplorer from './components/GoodsExplorer';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'ERP Overview Statistics' },
    { id: 'nlquery', label: 'AI NL Query', icon: '💬', desc: 'Natural Language to SQL Terminal' },
    { id: 'search', label: 'Product Search', icon: '🔍', desc: 'Multi-Filter Garment Discovery' },
    { id: 'imagesearch', label: 'Image Search', icon: '📸', desc: 'CLIP Cosine Similarity Search' },
    { id: 'explorer', label: 'Goods Explorer', icon: '👕', desc: 'Technical Spec Gallery' }
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'nlquery':
        return <NLQuery />;
      case 'search':
        return <ProductSearch />;
      case 'imagesearch':
        return <ImageSearch />;
      case 'explorer':
        return <GoodsExplorer />;
      default:
        return <Dashboard />;
    }
  };

  const currentHeader = navItems.find(item => item.id === activeTab);

  return (
    <div className="app-container app-root">
      {/* Scoped responsive overrides. These only kick in at narrower
          viewports and don't touch desktop layout or any state/logic.
          No new JS state is introduced (e.g. no hamburger toggle) so
          existing behavior is fully preserved. */}
      <style>{`
        @media (max-width: 900px) {
          .app-root {
            flex-direction: column !important;
          }
          .app-root .sidebar {
            width: 100% !important;
            height: auto !important;
            flex-direction: row !important;
            align-items: center !important;
            padding: 0.75rem 1rem !important;
            gap: 1rem;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .app-root .logo-container {
            flex-shrink: 0;
          }
          .app-root .sidebar nav {
            flex: 1;
            min-width: 0;
          }
          .app-root .nav-links {
            display: flex !important;
            flex-direction: row !important;
            gap: 0.4rem;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 0.15rem;
          }
          .app-root .nav-item {
            flex-shrink: 0;
            white-space: nowrap;
          }
          .app-root .nav-item span:last-child {
            display: none;
          }
          .app-root .nav-item.active span:last-child {
            display: inline;
          }
          .app-root .sidebar > div[style*="margin-top"] {
            display: none !important;
          }
          .app-root .main-content {
            width: 100% !important;
          }
        }

        @media (max-width: 600px) {
          .app-root .top-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.5rem;
          }
          .app-root .header-title h1 {
            font-size: 1.25rem !important;
          }
          .app-root .header-title p {
            font-size: 0.8rem !important;
          }
          .app-root .nav-item span:first-child {
            font-size: 1rem !important;
          }
        }
      `}</style>

      {/* 1. Fixed Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">W</div>
          <span className="logo-text">WFX ERP</span>
        </div>

        <nav>
          <ul className="nav-links">
            {navItems.map(item => (
              <li 
                key={item.id} 
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Local System Active</span>
          </div>
        </div>
      </aside>

      {/* 2. Main content Panel */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title">
            <h1>{currentHeader.label}</h1>
            <p>{currentHeader.desc}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>v1.0.0-Beta</span>
          </div>
        </header>

        {/* Content Render */}
        <div style={{ flex: 1 }}>
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
}