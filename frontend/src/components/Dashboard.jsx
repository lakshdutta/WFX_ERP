import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/stats')
      .then(res => {
        if (!res.ok) throw new Error("Could not fetch stats");
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem' }}>Loading dashboard stats...</div>;
  if (error) return <div style={{ color: 'var(--danger)', margin: '2rem' }}>Error loading stats: {error} (Is the backend running?)</div>;
  if (!stats) return null;

  const { totals, revenue_trend, categories } = stats;

  // Find max revenue in trend to scale the custom bar heights
  const maxRevenue = Math.max(...revenue_trend.map(t => t.revenue), 1);

  return (
    <div>
      {/* 1. Stats Cards Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-header">
            <span>Finished Goods</span>
            <span style={{ fontSize: '1.2rem' }}>👕</span>
          </div>
          <div className="stat-value">{totals.finished_goods.toLocaleString()}</div>
          <div className="stat-footer trend-up">
            <span>↑ Coherent Styles</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-header">
            <span>Suppliers</span>
            <span style={{ fontSize: '1.2rem' }}>🏭</span>
          </div>
          <div className="stat-value">{totals.suppliers.toLocaleString()}</div>
          <div className="stat-footer" style={{ color: 'var(--text-muted)' }}>
            <span>Active Mills</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-header">
            <span>Buyers</span>
            <span style={{ fontSize: '1.2rem' }}>🏬</span>
          </div>
          <div className="stat-value">{totals.buyers.toLocaleString()}</div>
          <div className="stat-footer" style={{ color: 'var(--text-muted)' }}>
            <span>Retail Accounts</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-header">
            <span>Sales Orders</span>
            <span style={{ fontSize: '1.2rem' }}>📦</span>
          </div>
          <div className="stat-value">{totals.sales_orders.toLocaleString()}</div>
          <div className="stat-footer trend-up">
            <span>↑ Order Volume</span>
          </div>
        </div>

        <div className="glass-card stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-header">
            <span>Total Revenue</span>
            <span style={{ fontSize: '1.2rem', color: 'gold' }}>₹</span>
          </div>
          <div className="stat-value" style={{ color: '#60a5fa' }}>
            ₹{totals.revenue_inr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="stat-footer trend-up">
            <span>↑ Paid Sales Invoice Inflow</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Charts Row */}
      <div className="dashboard-trends-grid">
        {/* Revenue Trend Column Chart */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Revenue Trend (Last 6 Months)</h3>
          <div className="chart-container">
            {revenue_trend.map((t, idx) => {
              const heightPct = (t.revenue / maxRevenue) * 80 + 10; // Scale from 10% to 90%
              return (
                <div key={idx} className="chart-bar-wrapper">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${heightPct}%` }}
                  >
                    <div className="chart-tooltip">
                      ₹{t.revenue.toLocaleString()} ({t.count} Invoices)
                    </div>
                  </div>
                  <span className="chart-label">{t.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown progress list */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Category Breakdown</h3>
          <div className="category-list">
            {categories.slice(0, 5).map((cat, idx) => {
              const totalItems = totals.finished_goods;
              const percentage = totalItems > 0 ? Math.round((cat.count / totalItems) * 100) : 0;
              return (
                <div key={idx} className="category-row">
                  <div className="category-row-meta">
                    <span style={{ fontWeight: 600 }}>{cat.category}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{cat.count} styles ({percentage}%)</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${percentage}%`, background: idx % 2 === 0 ? 'var(--primary-gradient)' : 'var(--secondary-gradient)' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
