import React, { useState } from 'react';

export default function ImageSearch() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [textQuery, setTextQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMethod, setSearchMethod] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setTextQuery(''); // Clear text query
    
    // Automatically trigger upload and search
    uploadAndSearch(file, null);
  };

  const handleTextQuerySubmit = (e) => {
    e.preventDefault();
    if (!textQuery.trim()) return;
    
    setSelectedFile(null);
    setPreviewUrl(null);
    
    uploadAndSearch(null, textQuery);
  };

  const uploadAndSearch = (file, text) => {
    setLoading(true);
    const formData = new FormData();
    
    if (file) {
      formData.append('image', file);
    }
    if (text) {
      formData.append('text_fallback', text);
    }

    fetch(`${import.meta.env.VITE_BACKEND_URL}api/search-image`, {
      method: 'POST',
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error("Image vector matching failed");
        return res.json();
      })
      .then(data => {
        setItems(data.items || []);
        setSearchMethod(data.search_method || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("Similarity search failed: " + err.message);
        setLoading(false);
      });
  };

  const triggerFileSelect = () => {
    document.getElementById('img-upload-input').click();
  };

  return (
    <div className="image-search-root" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>


      {/* Search Input Panels */}
      <div className="search-panels-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Upload Zone */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontWeight: 700 }}>Upload Query Image</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Upload a fabric sample or sketch to search for visually similar styles.
          </p>
          
          <input 
            type="file" 
            id="img-upload-input" 
            accept="image/*" 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
          />
          
          <div className="dropzone-container" onClick={triggerFileSelect}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="dropzone-preview" />
            ) : (
              <>
                <div className="dropzone-icon">📷</div>
                <div style={{ fontWeight: 600 }}>Drag & Drop Image or Click to Browse</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG, JPG, JPEG up to 5MB</span>
              </>
            )}
          </div>
        </div>

        {/* Text-based Concept Search */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
          <h3 style={{ fontWeight: 700 }}>Semantic Concept Search</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No image handy? Describe the visual concept (e.g., "blue silk floral texture" or "crimson winter sweater") to generate a query embedding.
          </p>
          
          <form onSubmit={handleTextQuerySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input 
              type="text" 
              placeholder="Describe garment visual concept..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                padding: '0.75rem',
                outline: 'none'
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !textQuery.trim()}
              style={{
                background: 'var(--secondary-gradient)',
                color: 'white',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Search Concept Vector
            </button>
          </form>
        </div>
      </div>

      {/* Results Header */}
      <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Visually Similar Products ({items.length})</h2>
        {searchMethod && (
          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
            Method: {searchMethod}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem' }}>
          Searching vector space and calculating cosine similarity...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Upload an image or submit a visual concept description to retrieve similar items.
        </div>
      ) : (
        <div className="gallery-grid">
          {items.map((item, idx) => {
            const similarityPercent = Math.round(item.similarity * 100);
            return (
              <div key={idx} className="glass-card product-card">
                <div className="product-image-container">
                  <span className="similarity-badge">
                    {similarityPercent}% Match
                  </span>
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
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineBreak: 'anywhere', margin: '0.25rem 0' }}>
                    {item.specification_details ? item.specification_details.substring(0, 75) + '...' : ''}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className="product-price">₹{Number(item.price_inr).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}