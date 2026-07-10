import React, { useState, useEffect } from 'react';

export default function ProductSearch() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Filter States
  const [q, setQ] = useState('');
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedFabs, setSelectedFabs] = useState([]);
  const [selectedPrints, setSelectedPrints] = useState([]);
  const [selectedSeasons, setSelectedSeasons] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minGsm, setMinGsm] = useState('');
  const [maxGsm, setMaxGsm] = useState('');
  const [sortBy, setSortBy] = useState('style_number');
  const [sortDir, setSortDir] = useState('asc');
  
  // Available filters
  const categories = ['Dress', 'Shirt', 'Pants', 'Jacket', 'T-Shirt', 'Hoodie', 'Sweatshirt', 'Polo', 'Skirt', 'Shorts'];
  const fabrics = ['Cotton', 'Silk', 'Linen', 'Polyester', 'Wool', 'Denim', 'Rayon', 'Nylon'];
  const prints = ['Solid', 'Striped', 'Floral', 'Polka Dot', 'Checkered', 'Geometric', 'Animal Print', 'Abstract'];
  const seasons = ['Spring', 'Summer', 'Autumn', 'Winter', 'All Season'];
  const brands = ['WFX Basic', 'WFX Premium', 'Urban Thread', 'EcoWear', 'LuxeLine'];

  // Trigger search on change of any state
  useEffect(() => {
    fetchFilteredProducts();
  }, [q, selectedCats, selectedFabs, selectedPrints, selectedSeasons, selectedBrands, minGsm, maxGsm, sortBy, sortDir]);

  const fetchFilteredProducts = () => {
    setLoading(true);
    let url = new URL(`${import.meta.env.VITE_BACKEND_URL}api/search`);
    
    if (q) url.searchParams.append('q', q);
    if (selectedCats.length > 0) url.searchParams.append('category', selectedCats.join(','));
    if (selectedFabs.length > 0) url.searchParams.append('fabric', selectedFabs.join(','));
    if (selectedPrints.length > 0) url.searchParams.append('print', selectedPrints.join(','));
    if (selectedSeasons.length > 0) url.searchParams.append('season', selectedSeasons.join(','));
    if (selectedBrands.length > 0) url.searchParams.append('brand', selectedBrands.join(','));
    if (minGsm) url.searchParams.append('min_gsm', minGsm);
    if (maxGsm) url.searchParams.append('max_gsm', maxGsm);
    url.searchParams.append('sort_by', sortBy);
    url.searchParams.append('sort_dir', sortDir);
    url.searchParams.append('limit', '50'); // Fetch a large batch to demonstrate dynamic scrolling/updating

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch search results", err);
        setLoading(false);
      });
  };

  const handleCatChange = (cat) => {
    setSelectedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleFabChange = (fab) => {
    setSelectedFabs(prev => 
      prev.includes(fab) ? prev.filter(f => f !== fab) : [...prev, fab]
    );
  };

  const handlePrintChange = (print) => {
    setSelectedPrints(prev => 
      prev.includes(print) ? prev.filter(p => p !== print) : [...prev, print]
    );
  };

  const handleSeasonChange = (season) => {
    setSelectedSeasons(prev => 
      prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
    );
  };

  const handleBrandChange = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  return (
    <div className="search-layout">
      {/* 1. Sidebar Filters */}
      <div className="filter-sidebar">
        {/* Text Search */}
        <div className="filter-group">
          <label className="filter-label">Search Specifications</label>
          <input 
            type="text" 
            placeholder="Type e.g., Silk, Red..."
            value={q} 
            onChange={(e) => setQ(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              padding: '0.65rem 0.85rem',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Categories */}
        <div className="filter-group">
          <label className="filter-label">Categories</label>
          <div className="filter-checkbox-list">
            {categories.map((cat, idx) => (
              <label key={idx} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedCats.includes(cat)}
                  onChange={() => handleCatChange(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        {/* Fabrics */}
        <div className="filter-group">
          <label className="filter-label">Fabrics</label>
          <div className="filter-checkbox-list">
            {fabrics.map((fab, idx) => (
              <label key={idx} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedFabs.includes(fab)}
                  onChange={() => handleFabChange(fab)}
                />
                {fab}
              </label>
            ))}
          </div>
        </div>

        {/* Prints */}
        <div className="filter-group">
          <label className="filter-label">Prints</label>
          <div className="filter-checkbox-list">
            {prints.map((print, idx) => (
              <label key={idx} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedPrints.includes(print)}
                  onChange={() => handlePrintChange(print)}
                />
                {print}
              </label>
            ))}
          </div>
        </div>

        {/* Seasons */}
        <div className="filter-group">
          <label className="filter-label">Seasons</label>
          <div className="filter-checkbox-list">
            {seasons.map((season, idx) => (
              <label key={idx} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedSeasons.includes(season)}
                  onChange={() => handleSeasonChange(season)}
                />
                {season}
              </label>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div className="filter-group">
          <label className="filter-label">Brands</label>
          <div className="filter-checkbox-list">
            {brands.map((brand, idx) => (
              <label key={idx} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandChange(brand)}
                />
                {brand}
              </label>
            ))}
          </div>
        </div>

        {/* GSM Range */}
        <div className="filter-group">
          <label className="filter-label">GSM Range</label>
          <div className="range-inputs">
            <input 
              type="number" 
              placeholder="Min" 
              value={minGsm} 
              onChange={(e) => setMinGsm(e.target.value)}
            />
            <span style={{ color: 'var(--text-muted)' }}>-</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={maxGsm} 
              onChange={(e) => setMaxGsm(e.target.value)}
            />
          </div>
        </div>

        {/* Sort Controls */}
        <div className="filter-group">
          <label className="filter-label">Sort By</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              padding: '0.5rem',
              outline: 'none'
            }}
          >
            <option value="style_number" style={{ background: 'var(--bg-secondary)' }}>Style Number</option>
            <option value="price_inr" style={{ background: 'var(--bg-secondary)' }}>Price (INR)</option>
            <option value="gsm" style={{ background: 'var(--bg-secondary)' }}>GSM</option>
            <option value="stock_quantity" style={{ background: 'var(--bg-secondary)' }}>Stock Qty</option>
            <option value="brand" style={{ background: 'var(--bg-secondary)' }}>Brand</option>
            <option value="season" style={{ background: 'var(--bg-secondary)' }}>Season</option>
          </select>
          
          <select 
            value={sortDir} 
            onChange={(e) => setSortDir(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              padding: '0.5rem',
              outline: 'none',
              marginTop: '0.5rem'
            }}
          >
            <option value="asc" style={{ background: 'var(--bg-secondary)' }}>Ascending</option>
            <option value="desc" style={{ background: 'var(--bg-secondary)' }}>Descending</option>
          </select>
        </div>
      </div>

      {/* 2. Results Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Results ({items.length})</h2>
          {loading && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Updating list...</span>}
        </div>

        {items.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products found matching the selected filters.
          </div>
        ) : (
          <div className="gallery-grid">
            {items.map((item, idx) => (
              <div key={idx} className="glass-card product-card" style={{ padding: '1rem' }}>
                <div className="product-image-container" style={{ height: '140px' }}>
                  {item.similarity !== undefined && item.similarity !== null && (
                    <span className="similarity-badge">
                      {Math.round(item.similarity * 100)}% Match
                    </span>
                  )}
                  <img 
                    src={item.image_url} 
                    alt={item.style_number} 
                    className="product-image"
                  />
                </div>
                <div className="product-info">
                  <div className="product-meta">
                    <span>{item.fabric} • {item.gsm} GSM • {item.print}</span>
                    <span>{item.category} • {item.season}</span>
                  </div>
                  <div className="product-title" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                    {item.brand ? <strong>{item.brand}</strong> : null} {item.style_name || `${item.color} - ${item.style_number}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    By: {item.supplier_name || `Supplier #${item.supplier_id}`} | {item.style_number}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className="product-price" style={{ fontSize: '1rem' }}>₹{Number(item.price_inr).toLocaleString()}</span>
                    <span className="product-stock" style={{ fontSize: '0.75rem' }}>Stock: {item.stock_quantity}</span>
                  </div>
                  <button className="btn-wfx-outline" style={{ marginTop: '0.75rem', width: '100%' }} onClick={() => setSelectedProduct(item)}>Explore</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  <strong style={{ color: 'var(--text-muted)' }}>Color & Print:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{selectedProduct.color}, {selectedProduct.print}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Brand & Season:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{selectedProduct.brand}, {selectedProduct.season}</div>
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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cost Price: <strong style={{color: 'white'}}>₹{Number(selectedProduct.cost).toLocaleString()}</strong></span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Selling Price:</span>
                </div>
                <span className="product-price" style={{ fontSize: '1.4rem' }}>₹{Number(selectedProduct.price_inr).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
