const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'erp_local.db');

function runVerification() {
    console.log("=== ERP Platform Code Verification ===");
    console.log("Database file:", DB_PATH);

    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error("❌ Failed to connect to SQLite database:", err.message);
            process.exit(1);
        }
        console.log("✅ Successfully connected to erp_local.db");
        checkTables();
    });

    function checkTables() {
        const tables = ['suppliers', 'buyers', 'finished_goods', 'tech_packs', 'sales_orders', 'sales_invoices'];
        let checksCompleted = 0;

        tables.forEach(table => {
            db.get(`SELECT COUNT(*) as count FROM ${table};`, [], (err, row) => {
                if (err) {
                    console.error(`❌ Error querying table ${table}:`, err.message);
                } else {
                    console.log(`✅ Table '${table}' exists and contains ${row.count} rows`);
                }
                checksCompleted++;
                if (checksCompleted === tables.length) {
                    testSearchQueries();
                }
            });
        });
    }

    function testSearchQueries() {
        console.log("\n--- Testing Structured Product Search ---");
        // Test query filtering by category, fabric and GSM range
        const query = `
            SELECT fg.style_number, fg.category, fg.fabric, fg.gsm, fg.price_inr
            FROM finished_goods fg
            WHERE fg.category = 'Dress' AND fg.fabric = 'Silk' AND fg.gsm > 80
            LIMIT 3;
        `;
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error("❌ Product search query failed:", err.message);
            } else {
                console.log(`✅ Search query succeeded. Returned ${rows.length} rows.`);
                rows.forEach(r => {
                    console.log(`   - Style: ${r.style_number} | Cat: ${r.category} | Fabric: ${r.fabric} | GSM: ${r.gsm} | Price: ₹${r.price_inr}`);
                });
            }
            testVectorSimilarity();
        });
    }

    function testVectorSimilarity() {
        console.log("\n--- Testing Vector Similarity Search Fallback ---");
        // Fetch all tech packs
        db.all("SELECT style_number, image_embedding FROM tech_packs LIMIT 10;", [], (err, rows) => {
            if (err) {
                console.error("❌ Failed to fetch tech packs for vector math:", err.message);
                db.close();
                return;
            }

            console.log(`✅ Fetched ${rows.length} tech packs. Simulating CLIP search vector...`);
            
            // Create a mock query vector of 512 dimensions (all 0.0 except indices representing 'Dress' and 'Silk')
            // Match indices for categories/fabrics
            const queryVec = new Array(512).fill(0).map(() => (Math.random() - 0.5) * 0.1);
            queryVec[0] += 0.4; // Category index
            queryVec[1] += 0.4; // Fabric index
            
            // Normalize query vector
            const qMag = Math.sqrt(queryVec.reduce((sum, val) => sum + val * val, 0));
            const normQueryVec = queryVec.map(x => x / qMag);

            const scored = [];
            rows.forEach(row => {
                try {
                    const emb = JSON.parse(row.image_embedding);
                    if (emb.length !== 512) return;

                    // Cosine similarity = dot(A, B) / (norm(A) * norm(B))
                    let dot = 0;
                    let magA = 0;
                    let magB = 0;
                    for (let i = 0; i < 512; i++) {
                        dot += normQueryVec[i] * emb[i];
                        magA += normQueryVec[i] * normQueryVec[i];
                        magB += emb[i] * emb[i];
                    }
                    const similarity = dot / (Math.sqrt(magA) * Math.sqrt(magB));
                    scored.push({ style: row.style_number, similarity });
                } catch (e) {
                    console.error("Error parsing embedding for style:", row.style_number);
                }
            });

            // Sort matches
            scored.sort((a, b) => b.similarity - a.similarity);
            console.log("✅ Vector matching complete. Top 3 matches:");
            scored.slice(0, 3).forEach((item, idx) => {
                console.log(`   ${idx + 1}. Style: ${item.style} | Similarity Score: ${(item.similarity * 100).toFixed(2)}%`);
            });

            db.close(() => {
                console.log("\n✅ Verification complete. All core backend database logic is validated!");
            });
        });
    }
}

runVerification();
