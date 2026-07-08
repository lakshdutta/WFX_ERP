const fs = require('fs');

function generateSeedData(numFinishedGoods = 200, numOrders = 600) {
    // Basic LCG random generator for reproducibility without external packages
    let seed = 42;
    function random() {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    function choice(arr) {
        return arr[Math.floor(random() * arr.length)];
    }
    function randInt(min, max) {
        return Math.floor(random() * (max - min + 1)) + min;
    }
    function randRange(min, max) {
        return random() * (max - min) + min;
    }

    // 1. Suppliers Data
    const suppliers = [
        { name: "Vardhman Textiles Ltd", email: "info@vardhman.com", phone: "+91-161-2228943", address: "Ludhiana, Punjab, India" },
        { name: "Arvind Mills", email: "contact@arvind.in", phone: "+91-79-68268000", address: "Ahmedabad, Gujarat, India" },
        { name: "Welspun India", email: "sales@welspun.com", phone: "+91-22-66136000", address: "Mumbai, Maharashtra, India" },
        { name: "Raymond Ltd", email: "support@raymond.in", phone: "+91-22-40349000", address: "Thane, Maharashtra, India" },
        { name: "Sutlej Textiles", email: "export@sutlejtextiles.com", phone: "+91-22-4219 8800", address: "Mumbai, India" },
        { name: "Page Industries", email: "supplier@pageind.com", phone: "+91-80-49454545", address: "Bengaluru, Karnataka, India" },
        { name: "KPR Mill Limited", email: "kpr@kprmill.com", phone: "+91-422-2207777", address: "Coimbatore, Tamil Nadu, India" },
        { name: "Trident Group", email: "trident@tridentindia.com", phone: "+91-161-5039999", address: "Barnala, Punjab, India" },
        { name: "Loyal Textile Mills", email: "loyal@loyaltextiles.com", phone: "+91-44-42261111", address: "Chennai, Tamil Nadu, India" },
        { name: "Shahi Exports", email: "sourcing@shahi.co.in", phone: "+91-129-4281000", address: "Faridabad, Haryana, India" }
    ];

    // 2. Buyers Data
    const buyers = [
        { name: "Reliance Retail", email: "buying@reliance.com", phone: "+91-22-44770000", address: "Navi Mumbai, India" },
        { name: "Aditya Birla Fashion & Retail", email: "abfrl.buyer@adityabirla.com", phone: "+91-86579-79000", address: "Mumbai, India" },
        { name: "Tata Trent (Westside)", email: "westside@trent-tata.com", phone: "+91-22-67099000", address: "Mumbai, India" },
        { name: "Zara India (Inditex)", email: "purchasing@zara.in", phone: "+91-11-46060000", address: "New Delhi, India" },
        { name: "H&M India", email: "hm.buying@hm.com", phone: "+91-11-66440000", address: "Gurugram, Haryana, India" },
        { name: "Marks & Spencer India", email: "sourcing@marksandspencer.in", phone: "+91-124-4888000", address: "Gurugram, India" },
        { name: "Lifestyle International", email: "lifestyle@landmarkgroup.in", phone: "+91-80-41000000", address: "Bengaluru, India" },
        { name: "Shoppers Stop", email: "merch@shoppersstop.com", phone: "+91-22-42497000", address: "Mumbai, India" },
        { name: "Max Fashion", email: "max.buyer@landmarkgroup.in", phone: "+91-80-41001111", address: "Bengaluru, India" },
        { name: "Myntra Designs", email: "vendors@myntra.com", phone: "+91-80-61561999", address: "Bengaluru, India" },
        { name: "Nykaa Fashion", email: "buying@nykaa.com", phone: "+91-22-66141000", address: "Mumbai, India" },
        { name: "Fabindia Overseas", email: "artisans@fabindia.net", phone: "+91-11-40692000", address: "New Delhi, India" },
        { name: "Pantaloons", email: "merchandiser@pantaloons.in", phone: "+91-22-66253000", address: "Mumbai, India" },
        { name: "Decathlon India", email: "sports@decathlon.in", phone: "+91-76767-24321", address: "Bengaluru, India" },
        { name: "Benetton India", email: "buying@benetton.co.in", phone: "+91-124-4876000", address: "Gurugram, India" },
        { name: "Puma India", email: "retail@puma.com", phone: "+91-80-40224000", address: "Bengaluru, India" },
        { name: "Adidas India", email: "sourcing@adidas.com", phone: "+91-124-4553000", address: "Gurugram, India" },
        { name: "Ajio", email: "merchant@ajio.com", phone: "+91-22-44771111", address: "Mumbai, India" },
        { name: "Zivame", email: "buying@zivame.com", phone: "+91-80-68194444", address: "Bengaluru, India" },
        { name: "Peter England", email: "sourcing@peterengland.in", phone: "+91-80-40348000", address: "Bengaluru, India" }
    ];

    const categories = ['Dress', 'Shirt', 'Pants', 'Jacket', 'T-Shirt', 'Sweater', 'Skirt', 'Shorts'];
    const fabrics = ['Cotton', 'Silk', 'Linen', 'Polyester', 'Wool', 'Denim', 'Rayon', 'Nylon'];
    const colors = ['Crimson Red', 'Navy Blue', 'Forest Green', 'Charcoal Black', 'Ivory White', 
                    'Mustard Yellow', 'Olive Green', 'Classic Beige', 'Lavender', 'Peach', 'Teal', 'Burgundy'];

    // Generate Finished Goods
    const finishedGoods = [];
    let styleIdx = 100;
    for (let i = 0; i < numFinishedGoods; i++) {
        styleIdx++;
        const styleNumber = `SG-2026-${styleIdx}`;
        const category = choice(categories);
        const fabric = choice(fabrics);
        
        let gsm;
        if (fabric === 'Wool' || category === 'Jacket' || category === 'Sweater') {
            gsm = randInt(240, 450);
        } else if (fabric === 'Denim') {
            gsm = randInt(300, 500);
        } else if (fabric === 'Silk' || fabric === 'Rayon') {
            gsm = randInt(60, 120);
        } else {
            gsm = randInt(120, 220);
        }
            
        const color = choice(colors);
        
        let basePrice = 250.00;
        if (['Silk', 'Wool'].includes(fabric)) basePrice *= 3.5;
        else if (['Denim', 'Linen'].includes(fabric)) basePrice *= 2.0;
        if (['Jacket', 'Sweater'].includes(category)) basePrice *= 2.5;
            
        const priceInr = Number((basePrice * randRange(0.8, 1.4)).toFixed(2));
        const stockQuantity = randInt(10, 1500);
        const supplierId = randInt(1, suppliers.length);
        
        finishedGoods.push({
            style_number: styleNumber,
            category,
            fabric,
            gsm,
            color,
            price_inr: priceInr,
            stock_quantity: stockQuantity,
            supplier_id: supplierId
        });
    }

    // Generate Tech Packs
    const techPacks = [];
    for (const fg of finishedGoods) {
        const specDetails = `Tech Pack details for Style ${fg.style_number}. A premium ${fg.color} ${fg.category} made from ${fg.gsm} GSM ${fg.fabric}. Features reinforced stitching, standard sizing template fit, and customized branding label. Pre-shrunk fabric treatment applied. Tailored cuffs and custom buttons included.`;
        
        // Generate random CLIP embedding (512 dimensions)
        const emb = [];
        let magSq = 0;
        for (let j = 0; j < 512; j++) {
            // Simple random mock value
            const val = (random() - 0.5) * 0.2;
            emb.push(val);
            magSq += val * val;
        }
        
        // Add specific signals based on fabric/category
        const catIdx = categories.indexOf(fg.category);
        const fabIdx = fabrics.indexOf(fg.fabric);
        emb[catIdx] += 0.4;
        emb[fabIdx] += 0.4;
        magSq += 0.32; // updated magnitude base
        
        const mag = Math.sqrt(magSq);
        const normalizedEmb = emb.map(x => Number((x / mag).toFixed(6)));
        const imageUrl = `https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=400&q=80&sig=${randInt(1, 1000)}`;
        
        techPacks.push({
            style_number: fg.style_number,
            specification_details: specDetails,
            image_url: imageUrl,
            image_embedding: normalizedEmb
        });
    }

    // Generate Sales Orders & Invoices
    const salesOrders = [];
    const salesInvoices = [];
    const startDate = new Date(2025, 0, 1);
    let orderIdx = 10000;
    let invoiceIdx = 20000;

    for (let i = 0; i < numOrders; i++) {
        orderIdx++;
        const orderNumber = `ORD-${orderIdx}`;
        const buyerId = randInt(1, buyers.length);
        const fg = choice(finishedGoods);
        
        let quantity;
        if (fg.price_inr > 2000) quantity = randInt(10, 80);
        else if (fg.price_inr > 1000) quantity = randInt(20, 150);
        else quantity = randInt(50, 400);

        const daysOffset = randInt(0, 540);
        const orderDate = new Date(startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        
        const status = choice(['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Pending', 'Cancelled']);
        
        salesOrders.push({
            order_number: orderNumber,
            buyer_id: buyerId,
            style_number: fg.style_number,
            quantity,
            order_date: orderDate.toISOString().split('T')[0],
            status
        });

        if (status !== 'Cancelled') {
            invoiceIdx++;
            const invoiceNumber = `INV-${invoiceIdx}`;
            const amountInr = Number((fg.price_inr * quantity).toFixed(2));
            
            // Payment status
            const orderDateTime = orderDate.getTime();
            const currentDateTime = new Date(2026, 6, 7).getTime(); // 2026-07-07
            const daysSinceOrder = (currentDateTime - orderDateTime) / (24 * 60 * 60 * 1000);
            
            let paymentStatus = 'Pending';
            if (status === 'Delivered') {
                paymentStatus = choice(['Paid', 'Paid', 'Paid', 'Pending']);
            }
            
            if (paymentStatus === 'Pending' && daysSinceOrder > 30) {
                paymentStatus = 'Overdue';
            }

            const dueDate = new Date(orderDateTime + 30 * 24 * 60 * 60 * 1000);

            salesInvoices.push({
                invoice_number: invoiceNumber,
                order_number: orderNumber,
                amount_inr: amountInr,
                payment_status: paymentStatus,
                issue_date: orderDate.toISOString().split('T')[0],
                due_date: dueDate.toISOString().split('T')[0]
            });
        }
    }

    // Compile SQL lines
    const sqlLines = ["-- Seeding ERP Platform Tables\n"];

    sqlLines.push("-- Suppliers");
    suppliers.forEach(s => {
        const name = s.name.replace(/'/g, "''");
        const addr = s.address.replace(/'/g, "''");
        sqlLines.push(`INSERT INTO suppliers (name, contact_email, phone, address) VALUES ('${name}', '${s.email}', '${s.phone}', '${addr}');`);
    });

    sqlLines.push("\n-- Buyers");
    buyers.forEach(b => {
        const name = b.name.replace(/'/g, "''");
        const addr = b.address.replace(/'/g, "''");
        sqlLines.push(`INSERT INTO buyers (name, contact_email, phone, address) VALUES ('${name}', '${b.email}', '${b.phone}', '${addr}');`);
    });

    sqlLines.push("\n-- Finished Goods");
    finishedGoods.forEach(fg => {
        sqlLines.push(`INSERT INTO finished_goods (style_number, category, fabric, gsm, color, price_inr, stock_quantity, supplier_id) VALUES ('${fg.style_number}', '${fg.category}', '${fg.fabric}', ${fg.gsm}, '${fg.color}', ${fg.price_inr}, ${fg.stock_quantity}, ${fg.supplier_id});`);
    });

    sqlLines.push("\n-- Tech Packs");
    techPacks.forEach(tp => {
        const specs = tp.specification_details.replace(/'/g, "''");
        const embStr = `[${tp.image_embedding.join(',')}]`;
        sqlLines.push(`INSERT INTO tech_packs (style_number, specification_details, image_url, image_embedding) VALUES ('${tp.style_number}', '${specs}', '${tp.image_url}', '${embStr}');`);
    });

    sqlLines.push("\n-- Sales Orders");
    salesOrders.forEach(o => {
        sqlLines.push(`INSERT INTO sales_orders (order_number, buyer_id, style_number, quantity, order_date, status) VALUES ('${o.order_number}', ${o.buyer_id}, '${o.style_number}', ${o.quantity}, '${o.order_date}', '${o.status}');`);
    });

    sqlLines.push("\n-- Sales Invoices");
    salesInvoices.forEach(inv => {
        sqlLines.push(`INSERT INTO sales_invoices (invoice_number, order_number, amount_inr, payment_status, issue_date, due_date) VALUES ('${inv.invoice_number}', '${inv.order_number}', ${inv.amount_inr}, '${inv.payment_status}', '${inv.issue_date}', '${inv.due_date}');`);
    });

    fs.writeFileSync('C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/seed.sql', sqlLines.join('\n'), 'utf-8');
    console.log("Generated seed.sql successfully!");
}

generateSeedData();
