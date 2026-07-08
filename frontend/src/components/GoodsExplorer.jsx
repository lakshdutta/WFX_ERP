import React, { useState, useEffect } from 'react';

export default function GoodsExplorer() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total_items: 0, total_pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Search parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('style_number');
  const [sortDir, setSortDir] = useState('asc');
  const [category, setCategory] = useState('');

  const categories = ['Dress', 'Shirt', 'Pants', 'Jacket', 'T-Shirt', 'Sweater', 'Skirt', 'Shorts'];

  useEffect(() => {
    fetchGoods();
  }, [currentPage, sortBy, sortDir, category]);

  const fetchGoods = () => {
    setLoading(true);
    let url = new URL('http://127.0.0.1:8000/api/search');
    url.searchParams.append('page', currentPage.toString());
    url.searchParams.append('limit', '12');
    url.searchParams.append('sort_by', sortBy);
    url.searchParams.append('sort_dir', sortDir);
    
    if (category) url.searchParams.append('category', category);
    if (searchTerm) url.searchParams.append('q', searchTerm);

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setPagination(data.pagination || { page: 1, limit: 12, total_items: 0, total_pages: 0 });
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load catalog", err);
        setLoading(false);
      });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGoods();
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages) return;
    setCurrentPage(newPage);
  };

  return (
    <div>
      {/* Search and Sort Toolbar */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
          <input 
            type="text" 
            placeholder="Search catalog (e.g., Silk, Red)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'white',
              padding: '0.5rem 1rem',
              outline: 'none',
              flex: 1
            }}
          />
          <button 
            type="submit"
            style={{
              background: 'var(--primary-gradient)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Category Select */}
          <select 
            value={category} 
            onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'white',
              padding: '0.5rem',
              outline: 'none'
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat} style={{ background: 'var(--bg-secondary)' }}>{cat}</option>
            ))}
          </select>

          {/* Sort By Select */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'white',
              padding: '0.5rem',
              outline: 'none'
            }}
          >
            <option value="style_number" style={{ background: 'var(--bg-secondary)' }}>Style Number</option>
            <option value="price_inr" style={{ background: 'var(--bg-secondary)' }}>Price (INR)</option>
            <option value="gsm" style={{ background: 'var(--bg-secondary)' }}>GSM</option>
            <option value="stock_quantity" style={{ background: 'var(--bg-secondary)' }}>Stock Level</option>
          </select>

          {/* Sort Direction Select */}
          <select 
            value={sortDir} 
            onChange={(e) => setSortDir(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'white',
              padding: '0.5rem',
              outline: 'none'
            }}
          >
            <option value="asc" style={{ background: 'var(--bg-secondary)' }}>Ascending</option>
            <option value="desc" style={{ background: 'var(--bg-secondary)' }}>Descending</option>
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem' }}>Loading catalog items...</div>
      ) : items.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No goods found in database.
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                className="glass-card product-card" 
                onClick={() => setSelectedProduct(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-image-container">
                  <img 
                    src={item.image_url} 
                    alt={item.style_number} 
                    className="product-image"
                  />
                </div>
                <div className="product-info">
                  <div className="product-meta">
                    <span>{item.fabric} • {item.gsm} GSM</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="product-title">{item.color} - {item.style_number}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className="product-price">₹{Number(item.price_inr).toLocaleString()}</span>
                    <span className="product-stock" style={{ color: item.stock_quantity < 50 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      Stock: {item.stock_quantity}
                    </span>
                  </div>
                  <button className="btn-wfx-outline" style={{ marginTop: '0.75rem', width: '100%' }}>Explore</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ←
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Page <strong style={{ color: 'white' }}>{currentPage}</strong> of {pagination.total_pages} ({pagination.total_items} items)
              </span>
              <button 
                className="page-btn" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.total_pages}
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal Dialog */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>
            <img src={selectedProduct.image_url} alt="Garment spec" className="modal-image" />
            <div className="modal-body">
              <div>
                <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-accent)' }}>
                  {selectedProduct.category} Spec Sheet
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  Style {selectedProduct.style_number}
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Fabric:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{selectedProduct.fabric}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Weight:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{selectedProduct.gsm} GSM</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Color Theme:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{selectedProduct.color}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Stock Status:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: selectedProduct.stock_quantity < 50 ? 'var(--danger)' : 'var(--success)' }}>
                    {selectedProduct.stock_quantity} Units Available
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Supplier:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{selectedProduct.supplier_name || "Internal Manufacturing"}</div>
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tech Pack Specs:</strong>
                <p style={{ fontSize: '0.85rem', color: '#d1d5db', marginTop: '0.25rem', lineHeight: '1.4' }}>
                  {selectedProduct.specification_details || "No technical specs uploaded."}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Base Cost:</span>
                <span className="product-price" style={{ fontSize: '1.4rem' }}>₹{Number(selectedProduct.price_inr).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
