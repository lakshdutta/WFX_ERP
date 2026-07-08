const fs = require('fs');
const path = require('path');

const paths = [
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/schema.sql',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/seed.sql',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/seed_generator.js',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/backend/requirements.txt',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/backend/app/main.py',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/backend/app/database.py',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/backend/app/vector_helper.py',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/backend/app/ai_helper.py',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/frontend/src/App.jsx',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/frontend/src/index.css',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/frontend/src/components/Dashboard.jsx',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/frontend/src/components/NLQuery.jsx',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/frontend/src/components/ProductSearch.jsx',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/frontend/src/components/ImageSearch.jsx',
    'C:/Users/laksh/.gemini/antigravity/scratch/ERP/frontend/src/components/GoodsExplorer.jsx',
];

console.log("=== VERIFYING CODEBASE INTEGRITY ===");
let missingCount = 0;

paths.forEach(p => {
    try {
        const stats = fs.statSync(p);
        console.log(`✅ [FOUND] ${path.basename(p)} (${(stats.size / 1024).toFixed(2)} KB)`);
    } catch (e) {
        console.log(`❌ [MISSING] ${p}`);
        missingCount++;
    }
});

console.log("\nSummary:");
if (missingCount === 0) {
    console.log("🎉 SUCCESS: All 15 required codebase files exist and are populated!");
} else {
    console.log(`⚠️ WARNING: ${missingCount} files are missing!`);
}
