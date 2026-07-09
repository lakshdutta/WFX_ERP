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
        { name: "Vardhman Textiles Ltd", email: "info@vardhman.com", phone: "+91-161-2228943", address: "Ludhiana, Punjab, India", country: "India", contact: "Rahul Singh", lead_time: 14, rating: 4.5 },
        { name: "Arvind Mills", email: "contact@arvind.in", phone: "+91-79-68268000", address: "Ahmedabad, Gujarat, India", country: "India", contact: "Sanjay Patel", lead_time: 21, rating: 4.8 },
        { name: "Welspun India", email: "sales@welspun.com", phone: "+91-22-66136000", address: "Mumbai, Maharashtra, India", country: "India", contact: "Amit Sharma", lead_time: 30, rating: 4.2 },
        { name: "Raymond Ltd", email: "support@raymond.in", phone: "+91-22-40349000", address: "Thane, Maharashtra, India", country: "India", contact: "Priya Desai", lead_time: 10, rating: 4.9 },
        { name: "Sutlej Textiles", email: "export@sutlejtextiles.com", phone: "+91-22-4219 8800", address: "Mumbai, India", country: "India", contact: "Vijay Kumar", lead_time: 25, rating: 4.0 },
        { name: "Page Industries", email: "supplier@pageind.com", phone: "+91-80-49454545", address: "Bengaluru, Karnataka, India", country: "India", contact: "Anil Menon", lead_time: 15, rating: 4.6 },
        { name: "KPR Mill Limited", email: "kpr@kprmill.com", phone: "+91-422-2207777", address: "Coimbatore, Tamil Nadu, India", country: "India", contact: "K. Ramasamy", lead_time: 20, rating: 4.3 },
        { name: "Trident Group", email: "trident@tridentindia.com", phone: "+91-161-5039999", address: "Barnala, Punjab, India", country: "India", contact: "Neha Gupta", lead_time: 18, rating: 4.7 },
        { name: "Loyal Textile Mills", email: "loyal@loyaltextiles.com", phone: "+91-44-42261111", address: "Chennai, Tamil Nadu, India", country: "India", contact: "Ravi Krishnan", lead_time: 22, rating: 4.1 },
        { name: "Shahi Exports", email: "sourcing@shahi.co.in", phone: "+91-129-4281000", address: "Faridabad, Haryana, India", country: "India", contact: "Sunil Ahuja", lead_time: 28, rating: 4.4 }
    ];

    // 2. Buyers Data
    const buyers = [
        { name: "Reliance Retail", email: "buying@reliance.com", phone: "+91-22-44770000", address: "Navi Mumbai, India", country: "India", category: "Retailer" },
        { name: "Aditya Birla Fashion & Retail", email: "abfrl.buyer@adityabirla.com", phone: "+91-86579-79000", address: "Mumbai, India", country: "India", category: "Retailer" },
        { name: "Tata Trent (Westside)", email: "westside@trent-tata.com", phone: "+91-22-67099000", address: "Mumbai, India", country: "India", category: "Retailer" },
        { name: "Zara India (Inditex)", email: "purchasing@zara.in", phone: "+91-11-46060000", address: "New Delhi, India", country: "India", category: "Wholesaler" },
        { name: "H&M India", email: "hm.buying@hm.com", phone: "+91-11-66440000", address: "Gurugram, Haryana, India", country: "India", category: "Wholesaler" },
        { name: "Marks & Spencer India", email: "sourcing@marksandspencer.in", phone: "+91-124-4888000", address: "Gurugram, India", country: "India", category: "Retailer" },
        { name: "Lifestyle International", email: "lifestyle@landmarkgroup.in", phone: "+91-80-41000000", address: "Bengaluru, India", country: "India", category: "Retailer" },
        { name: "Shoppers Stop", email: "merch@shoppersstop.com", phone: "+91-22-42497000", address: "Mumbai, India", country: "India", category: "Retailer" },
        { name: "Max Fashion", email: "max.buyer@landmarkgroup.in", phone: "+91-80-41001111", address: "Bengaluru, India", country: "India", category: "Retailer" },
        { name: "Myntra Designs", email: "vendors@myntra.com", phone: "+91-80-61561999", address: "Bengaluru, India", country: "India", category: "E-Commerce" },
        { name: "Nykaa Fashion", email: "buying@nykaa.com", phone: "+91-22-66141000", address: "Mumbai, India", country: "India", category: "E-Commerce" },
        { name: "Fabindia Overseas", email: "artisans@fabindia.net", phone: "+91-11-40692000", address: "New Delhi, India", country: "India", category: "Boutique" },
        { name: "Pantaloons", email: "merchandiser@pantaloons.in", phone: "+91-22-66253000", address: "Mumbai, India", country: "India", category: "Retailer" },
        { name: "Decathlon India", email: "sports@decathlon.in", phone: "+91-76767-24321", address: "Bengaluru, India", country: "India", category: "Retailer" },
        { name: "Benetton India", email: "buying@benetton.co.in", phone: "+91-124-4876000", address: "Gurugram, India", country: "India", category: "Wholesaler" },
        { name: "Puma India", email: "retail@puma.com", phone: "+91-80-40224000", address: "Bengaluru, India", country: "India", category: "Wholesaler" },
        { name: "Adidas India", email: "sourcing@adidas.com", phone: "+91-124-4553000", address: "Gurugram, India", country: "India", category: "Wholesaler" },
        { name: "Ajio", email: "merchant@ajio.com", phone: "+91-22-44771111", address: "Mumbai, India", country: "India", category: "E-Commerce" },
        { name: "Zivame", email: "buying@zivame.com", phone: "+91-80-68194444", address: "Bengaluru, India", country: "India", category: "E-Commerce" },
        { name: "Peter England", email: "sourcing@peterengland.in", phone: "+91-80-40348000", address: "Bengaluru, India", country: "India", category: "Retailer" }
    ];

    const templates = [
        { category: 'Dress', color: 'Crimson Red', fabric: 'Silk', print: 'Floral', imageId: 'photo-1595777457583-95e059d581b8' },
        { category: 'Dress', color: 'Ivory White', fabric: 'Cotton', print: 'Solid', imageId: 'photo-1572804013309-59a88b7e92f1' },
        { category: 'Dress', color: 'Mustard Yellow', fabric: 'Polyester', print: 'Solid', imageId: 'photo-1496747611176-843222e1e57c' },
        { category: 'Shirt', color: 'Navy Blue', fabric: 'Denim', print: 'Polka Dot', imageId: 'photo-1596755094514-f87e34085b2c' },
        { category: 'Shirt', color: 'Ivory White', fabric: 'Cotton', print: 'Solid', imageId: 'photo-1603252109303-2751441dd157' },
        { category: 'Shirt', color: 'Charcoal Black', fabric: 'Cotton', print: 'Solid', imageId: 'photo-1602810318383-e386cc2a3ccf' },
        { category: 'Pants', color: 'Navy Blue', fabric: 'Denim', print: 'Solid', imageId: 'photo-1541099649105-f69ad21f3246' },
        { category: 'Pants', color: 'Classic Beige', fabric: 'Cotton', print: 'Solid', imageId: 'photo-1584308666744-24d5c474f2ae' },
        { category: 'Pants', color: 'Charcoal Black', fabric: 'Polyester', print: 'Solid', imageId: 'photo-1624378439575-d8705ad7ae80' },
        { category: 'Jacket', color: 'Charcoal Black', fabric: 'Rayon', print: 'Solid', imageId: 'photo-1551028719-00167b16eac5' },
        { category: 'Jacket', color: 'Navy Blue', fabric: 'Denim', print: 'Solid', imageId: 'photo-1591047139829-d91aecb6caea' },
        { category: 'Jacket', color: 'Olive Green', fabric: 'Nylon', print: 'Solid', imageId: 'photo-1544923246-77307dd654cb' },
        { category: 'T-Shirt', color: 'Charcoal Black', fabric: 'Cotton', print: 'Solid', imageId: 'photo-1521572267360-ee0c2909d518' },
        { category: 'T-Shirt', color: 'Ivory White', fabric: 'Cotton', print: 'Solid', imageId: 'photo-1583743814966-8936f5b7be1a' },
        { category: 'T-Shirt', color: 'Charcoal Black', fabric: 'Polyester', print: 'Solid', imageId: 'photo-1562157873-818bc0726f68' },
        { category: 'Sweater', color: 'Crimson Red', fabric: 'Wool', print: 'Solid', imageId: 'photo-1434389677669-e08b4cac3105' },
        { category: 'Sweater', color: 'Charcoal Black', fabric: 'Wool', print: 'Solid', imageId: 'photo-1614975058789-41316d0e2e9c' },
        { category: 'Sweater', color: 'Classic Beige', fabric: 'Wool', print: 'Solid', imageId: 'photo-1620799140408-edc6dcb6d633' },
        { category: 'Skirt', color: 'Charcoal Black', fabric: 'Cotton', print: 'Solid', imageId: 'photo-1583496661160-fb5886a0aaaa' },
        { category: 'Skirt', color: 'Navy Blue', fabric: 'Denim', print: 'Solid', imageId: 'photo-1509551388413-e18d0ac5d495' },
        { category: 'Skirt', color: 'Crimson Red', fabric: 'Polyester', print: 'Solid', imageId: 'photo-1601924994987-69e26d50dc26' },
        { category: 'Shorts', color: 'Navy Blue', fabric: 'Denim', print: 'Solid', imageId: 'photo-1591195853828-11db59a44f6b' },
        { category: 'Shorts', color: 'Classic Beige', fabric: 'Cotton', print: 'Solid', imageId: 'photo-1519242220831-09410926fbff' },
        { category: 'Shorts', color: 'Charcoal Black', fabric: 'Polyester', print: 'Solid', imageId: 'photo-1479064555552-3ef4979f8908' }
    ];

    const categories = ['Dress', 'Shirt', 'Pants', 'Jacket', 'T-Shirt', 'Sweater', 'Skirt', 'Shorts'];
    const fabrics = ['Cotton', 'Silk', 'Linen', 'Polyester', 'Wool', 'Denim', 'Rayon', 'Nylon'];
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter', 'All Season'];
    const brands = ['WFX Basic', 'WFX Premium', 'Urban Thread', 'EcoWear', 'LuxeLine'];

    // Generate Finished Goods
    const finishedGoods = [];
    let styleIdx = 100;
    for (let i = 0; i < numFinishedGoods; i++) {
        styleIdx++;
        const styleNumber = `SG-2026-${styleIdx}`;
        
        // Pick a template to ensure image matches specs
        const template = choice(templates);
        const { category, fabric, color, print, imageId } = template;
        
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
            
        const season = choice(seasons);
        const brand = choice(brands);
        const styleName = `${brand} ${color} ${fabric} ${category}`;
        
        let baseCost = 150.00;
        if (['Silk', 'Wool'].includes(fabric)) baseCost *= 3.5;
        else if (['Denim', 'Linen'].includes(fabric)) baseCost *= 2.0;
        if (['Jacket', 'Sweater'].includes(category)) baseCost *= 2.5;
            
        const cost = Number((baseCost * randRange(0.8, 1.4)).toFixed(2));
        const priceInr = Number((cost * randRange(1.5, 2.5)).toFixed(2)); // Markup
        const stockQuantity = randInt(10, 1500);
        const supplierId = randInt(1, suppliers.length);
        
        finishedGoods.push({
            style_number: styleNumber,
            style_name: styleName,
            category,
            fabric,
            gsm,
            color,
            print,
            season,
            brand,
            cost,
            price_inr: priceInr,
            stock_quantity: stockQuantity,
            supplier_id: supplierId,
            imageId // store it temporarily for tech packs
        });
    }

    // Generate Tech Packs
    const techPacks = [];

    for (const fg of finishedGoods) {
        const specDetails = `Tech Pack details for Style ${fg.style_number}. A premium ${fg.color} ${fg.category} made from ${fg.gsm} GSM ${fg.fabric}. Features reinforced stitching, standard sizing template fit, and customized branding label. Pre-shrunk fabric treatment applied. Tailored cuffs and custom buttons included.`;
        const fabricDetails = `${fg.gsm} GSM ${fg.fabric} with ${fg.print} pattern.`;
        const construction = `Standard ${fg.category} construction with reinforced seams.`;
        const washInstructions = `Machine wash cold. Do not bleach. Tumble dry low.`;

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
        emb[fabIdx + 8] += 0.4;
        magSq += 0.32; // updated magnitude base
        
        const mag = Math.sqrt(magSq);
        const normalizedEmb = emb.map(x => Number((x / mag).toFixed(6)));
        
        const imageUrl = `https://images.unsplash.com/${fg.imageId}?auto=format&fit=crop&w=400&q=80`;
        
        techPacks.push({
            style_number: fg.style_number,
            fabric_details: fabricDetails,
            construction: construction,
            wash_instructions: washInstructions,
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
        
        let shipmentDate = null;
        if (['Delivered', 'Shipped'].includes(status)) {
             shipmentDate = new Date(orderDate.getTime() + randInt(3, 14) * 24 * 60 * 60 * 1000);
        }
        
        salesOrders.push({
            order_number: orderNumber,
            buyer_id: buyerId,
            style_number: fg.style_number,
            quantity,
            order_date: orderDate.toISOString().split('T')[0],
            shipment_date: shipmentDate ? shipmentDate.toISOString().split('T')[0] : null,
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
                currency: 'INR',
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
        const contact = s.contact.replace(/'/g, "''");
        sqlLines.push(`INSERT INTO suppliers (name, contact_email, phone, address, country, contact, lead_time, rating) VALUES ('${name}', '${s.email}', '${s.phone}', '${addr}', '${s.country}', '${contact}', ${s.lead_time}, ${s.rating});`);
    });

    sqlLines.push("\n-- Buyers");
    buyers.forEach(b => {
        const name = b.name.replace(/'/g, "''");
        const addr = b.address.replace(/'/g, "''");
        sqlLines.push(`INSERT INTO buyers (name, contact_email, phone, address, country, buyer_category) VALUES ('${name}', '${b.email}', '${b.phone}', '${addr}', '${b.country}', '${b.category}');`);
    });

    sqlLines.push("\n-- Finished Goods");
    finishedGoods.forEach(fg => {
        const styleName = fg.style_name.replace(/'/g, "''");
        sqlLines.push(`INSERT INTO finished_goods (style_number, style_name, category, fabric, gsm, color, print, season, brand, cost, price_inr, stock_quantity, supplier_id) VALUES ('${fg.style_number}', '${styleName}', '${fg.category}', '${fg.fabric}', ${fg.gsm}, '${fg.color}', '${fg.print}', '${fg.season}', '${fg.brand}', ${fg.cost}, ${fg.price_inr}, ${fg.stock_quantity}, ${fg.supplier_id});`);
    });

    sqlLines.push("\n-- Tech Packs");
    techPacks.forEach(tp => {
        const specs = tp.specification_details.replace(/'/g, "''");
        const fabricDet = tp.fabric_details.replace(/'/g, "''");
        const constr = tp.construction.replace(/'/g, "''");
        const wash = tp.wash_instructions.replace(/'/g, "''");
        const embStr = `[${tp.image_embedding.join(',')}]`;
        sqlLines.push(`INSERT INTO tech_packs (style_number, fabric_details, construction, wash_instructions, specification_details, image_url, image_embedding) VALUES ('${tp.style_number}', '${fabricDet}', '${constr}', '${wash}', '${specs}', '${tp.image_url}', '${embStr}');`);
    });

    sqlLines.push("\n-- Sales Orders");
    salesOrders.forEach(o => {
        const shipDate = o.shipment_date ? `'${o.shipment_date}'` : 'NULL';
        sqlLines.push(`INSERT INTO sales_orders (order_number, buyer_id, style_number, quantity, order_date, shipment_date, status) VALUES ('${o.order_number}', ${o.buyer_id}, '${o.style_number}', ${o.quantity}, '${o.order_date}', ${shipDate}, '${o.status}');`);
    });

    sqlLines.push("\n-- Sales Invoices");
    salesInvoices.forEach(inv => {
        sqlLines.push(`INSERT INTO sales_invoices (invoice_number, order_number, amount_inr, currency, payment_status, issue_date, due_date) VALUES ('${inv.invoice_number}', '${inv.order_number}', ${inv.amount_inr}, '${inv.currency}', '${inv.payment_status}', '${inv.issue_date}', '${inv.due_date}');`);
    });

    const path = require('path');
    const outputPath = path.resolve(__dirname, 'seed.sql');
    fs.writeFileSync(outputPath, sqlLines.join('\n'), 'utf-8');
    console.log("Generated seed.sql successfully at:", outputPath);
}

generateSeedData();
