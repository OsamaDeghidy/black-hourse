import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const generateMockData = () => {
  const categories = ["شاشات", "بطاريات", "باغات وزجاج", "فلاتات وشواحن", "إكسسوارات"];
  const items = [
    { name: "شاشة آيفون 13 برو ماكس (OLED)", cat: "شاشات", pw: 2400, pr: 2900, mobiles: ["iPhone 13 Pro Max"] },
    { name: "شاشة سامسونج Galaxy S22 Ultra", cat: "شاشات", pw: 5800, pr: 6500, mobiles: ["Samsung S22 Ultra"] },
    { name: "باغة بايركس كاميرا آيفون 15 برو", cat: "باغات وزجاج", pw: 120, pr: 180, mobiles: ["iPhone 15 Pro"] },
    { name: "جراب شفاف ماغ سيف آيفون 14", cat: "إكسسوارات", pw: 85, pr: 150, mobiles: ["iPhone 14"] },
    { name: "فلاتة شحن ريلمي 8 برو", cat: "فلاتات وشواحن", pw: 180, pr: 250, mobiles: ["Realme 8 Pro"] },
    { name: "بطارية آيفون 11 برو ماكس", cat: "بطاريات", pw: 480, pr: 650, mobiles: ["iPhone 11 Pro Max"] },
    { name: "سماعة بلوتوث AirPods 3", cat: "إكسسوارات", pw: 450, pr: 650, mobiles: ["جميع الهواتف"] },
    { name: "شاشة شاومي Redmi Note 11", cat: "شاشات", pw: 900, pr: 1200, mobiles: ["Xiaomi Redmi Note 11"] },
    { name: "بطارية سامسونج A52 أصلية", cat: "بطاريات", pw: 350, pr: 450, mobiles: ["Samsung A52"] },
    { name: "شاحن تايب سي 25 واط سامسونج", cat: "فلاتات وشواحن", pw: 150, pr: 220, mobiles: ["Samsung"] },
    { name: "وصلة شحن أصلية آيفون Type-C to Lightning", cat: "فلاتات وشواحن", pw: 200, pr: 280, mobiles: ["iPhone"] },
    { name: "شاشة أوبو Reno 6 4G", cat: "شاشات", pw: 1400, pr: 1750, mobiles: ["Oppo Reno 6"] },
    { name: "باغة حماية الخصوصية آيفون 14 برو", cat: "باغات وزجاج", pw: 100, pr: 160, mobiles: ["iPhone 14 Pro"] },
    { name: "جراب سيليكون سامسونج S23 Ultra", cat: "إكسسوارات", pw: 90, pr: 140, mobiles: ["Samsung S23 Ultra"] },
    { name: "بطارية شاومي Poco X3 Pro", cat: "بطاريات", pw: 400, pr: 550, mobiles: ["Xiaomi Poco X3 Pro"] },
    
    // New 15 items
    { name: "شاشة أوبو رينو 8", cat: "شاشات", pw: 1600, pr: 1900, mobiles: ["Oppo Reno 8"] },
    { name: "بطارية آيفون 12", cat: "بطاريات", pw: 500, pr: 700, mobiles: ["iPhone 12"] },
    { name: "شاحن آيفون 20 واط أصلي", cat: "فلاتات وشواحن", pw: 350, pr: 500, mobiles: ["iPhone"] },
    { name: "باغة شاشة سامسونج A73", cat: "باغات وزجاج", pw: 150, pr: 250, mobiles: ["Samsung A73"] },
    { name: "جراب جلد فخم سامسونج Z Fold 4", cat: "إكسسوارات", pw: 250, pr: 400, mobiles: ["Samsung Z Fold 4"] },
    { name: "شاشة ريلمي 10", cat: "شاشات", pw: 1100, pr: 1400, mobiles: ["Realme 10"] },
    { name: "بطارية أوبو A54", cat: "بطاريات", pw: 300, pr: 450, mobiles: ["Oppo A54"] },
    { name: "سماعة سلكية Type-C أصلية", cat: "إكسسوارات", pw: 120, pr: 180, mobiles: ["Android"] },
    { name: "فلاتة باور فوليوم شاومي نوت 10", cat: "فلاتات وشواحن", pw: 80, pr: 150, mobiles: ["Xiaomi Note 10"] },
    { name: "شاشة فيفو V25", cat: "شاشات", pw: 1300, pr: 1650, mobiles: ["Vivo V25"] },
    { name: "جراب مضاد للصدمات مخصص (إصدار أسامة)", cat: "إكسسوارات", pw: 150, pr: 250, mobiles: ["اسامه"] },
    { name: "باغة كاميرا شاومي 13T", cat: "باغات وزجاج", pw: 90, pr: 150, mobiles: ["Xiaomi 13T"] },
    { name: "شاحن سيارة سريع 65 واط", cat: "فلاتات وشواحن", pw: 200, pr: 350, mobiles: ["جميع الهواتف"] },
    { name: "بطارية هواوي نوفا 9", cat: "بطاريات", pw: 380, pr: 500, mobiles: ["Huawei Nova 9"] },
    { name: "شاشة سامسونج S21 FE", cat: "شاشات", pw: 3200, pr: 3800, mobiles: ["Samsung S21 FE"] }
  ];

  const dbItems = items.map((item, i) => ({
    id: `prod_${i + 1}`,
    name: item.name,
    category: item.cat,
    priceWholesale: item.pw,
    priceRetail: item.pr,
    stockBranch1: Math.floor(Math.random() * 50) + 2,
    stockBranch2: Math.floor(Math.random() * 30),
    minStockAlert: Math.floor(Math.random() * 5) + 2,
    compatibleMobiles: item.mobiles,
    imageUrl: `https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&w=600&q=80`,
  }));

  const sales = [];
  for (let i = 1; i <= 30; i++) {
    const item = dbItems[Math.floor(Math.random() * dbItems.length)];
    const qty = Math.floor(Math.random() * 3) + 1;
    const branch = Math.random() > 0.5 ? "branch1" : "branch2";
    sales.push({
      id: `sale_${i}`,
      productId: item.id,
      productName: item.name,
      branch: branch,
      quantity: qty,
      price: item.priceRetail,
      total: item.priceRetail * qty,
      profit: (item.priceRetail - item.priceWholesale) * qty,
      date: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "عملية بيع أوتوماتيكية للتجربة",
      soldBy: branch === "branch1" ? "user 1" : "user 2",
    });
  }

  return {
    items: dbItems,
    sales: sales,
    settings: { spreadsheetId: "", spreadsheetUrl: "", lastSync: null },
    logs: [
      {
        id: "log_1",
        user: "system",
        actionType: "seed_data",
        details: "تم تهيئة النظام وإضافة 30 منتج تجريبي (Fake Data)",
        timestamp: new Date().toISOString(),
      }
    ],
    requests: [],
    orders: []
  };
};

async function seed() {
  try {
    console.log("Generating 30 fake items...");
    const data = generateMockData();
    console.log("Uploading to Upstash Redis...");
    await redis.set("blackhours_prototype_db", data);
    console.log("✅ Seed completed successfully! 30 items added.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seed();
