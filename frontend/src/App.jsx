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
    <div className="app-container">
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
