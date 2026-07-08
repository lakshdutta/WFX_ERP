import React, { useState, useRef, useEffect } from 'react';

export default function NLQuery() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am your AI ERP Assistant. Ask me any business question in plain English, and I'll generate the SQL, execute it, and explain the results!\n\n**Example questions you can ask:**\n- *\"Show pending invoices above ₹1,000\"*\n- *\"What is the total revenue by buyer?\"*\n- *\"List style numbers with fabric Silk and GSM above 150\"*\n- *\"Show all suppliers\"*"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:3000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText })
      });

      if (!res.ok) throw new Error("Server error query execution failed");
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.summary || data.answer || "Query executed.",
        sql: data.sql,
        columns: data.columns,
        results: data.rows || data.results,
        error: data.error
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Error processing query: ${err.message}. Make sure the backend server is running.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container-layout">
      {/* Messages History */}
      <div className="chat-history">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.sender}`}>
            <div className="chat-bubble">
              {/* Parse bold and linebreaks for markdown-like text */}
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {msg.text.split('\n').map((line, lIdx) => {
                  // Render bold text
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  let parts = [];
                  let lastIndex = 0;
                  let match;
                  while ((match = boldRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(line.substring(lastIndex, match.index));
                    }
                    parts.push(<strong key={match.index}>{match[1]}</strong>);
                    lastIndex = boldRegex.lastIndex;
                  }
                  if (lastIndex < line.length) {
                    parts.push(line.substring(lastIndex));
                  }
                  
                  return <div key={lIdx}>{parts.length > 0 ? parts : line}</div>;
                })}
              </div>

              {/* SQL output box */}
              {msg.sql && (
                <div className="sql-container">
                  <div className="sql-header">
                    <span>GENERATED SQL</span>
                    <span>PostgreSQL</span>
                  </div>
                  <pre className="sql-code"><code>{msg.sql}</code></pre>
                </div>
              )}

              {/* Error log if query failed */}
              {msg.error && (
                <div style={{ color: 'var(--danger)', marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <strong>SQL Execution Error:</strong> {msg.error}
                </div>
              )}

              {/* Data Table Result */}
              {msg.results && msg.results.length > 0 && (
                <div className="results-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        {msg.columns.map((col, idx) => (
                          <th key={idx}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.results.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {msg.columns.map((col, cIdx) => {
                            const val = row[col];
                            // Format numbers or display values nicely
                            let displayVal = val;
                            if (typeof val === 'number') {
                              if (col.includes('price') || col.includes('amount') || col.includes('revenue')) {
                                displayVal = `₹${val.toLocaleString()}`;
                              } else {
                                displayVal = val.toLocaleString();
                              }
                            } else if (val === null || val === undefined) {
                              displayVal = '-';
                            }
                            return <td key={cIdx}>{String(displayVal)}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message ai">
            <div className="chat-bubble" style={{ background: 'transparent', border: 'none', paddingLeft: '0' }}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite alternate' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite alternate 0.2s' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite alternate 0.4s' }}></div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>AI is compiling SQL & query results...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input query form */}
      <form onSubmit={handleSend} className="chat-input-area">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question (e.g., Show pending invoices above ₹1,000)..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? 'Asking...' : 'Ask AI'}
        </button>
      </form>
    </div>
  );
}
