import Database from 'better-sqlite3';

const db = Database('prisma/dev.db');

// Clear existing data
console.log('🗑️  Clearing existing products...');
db.prepare('DELETE FROM ProductTag').run();
db.prepare('DELETE FROM ProductText').run();
db.prepare('DELETE FROM Product').run();
db.prepare('DELETE FROM Tag').run();

// Real Japanese health products based on user's MCP data
const products = [
  {
    id: 'prod_001',
    category: 'health',
    pointValue: 150,
    texts: [
      {
        language: 'ja',
        name: 'Bufferin Premium DX',
        description: 'プレミアム処方の鎮痛解熱剤。速効性と効果の持続性を両立',
        effects: '頭痛、歯痛、生理痛、発熱などに優れた効果',
        sideEffects: '胃の不快感、眠気が生じることがあります',
        goodFor: '頭痛、生理痛、発熱時の解熱',
      },
      {
        language: 'en',
        name: 'Bufferin Premium DX',
        description: 'Premium formula analgesic and antipyretic with fast-acting and long-lasting effects',
        effects: 'Excellent for headaches, toothaches, menstrual pain, and fever',
        sideEffects: 'May cause stomach discomfort or drowsiness',
        goodFor: 'Headaches, menstrual pain, fever reduction',
      },
    ],
    tags: ['pain-relief', 'fever', 'headache', 'premium'],
  },
  {
    id: 'prod_002',
    category: 'health',
    pointValue: 120,
    texts: [
      {
        language: 'ja',
        name: 'Hyalein S',
        description: 'ヒアルロン酸配合の目薬。目の乾燥や疲れをやさしくケア',
        effects: 'ドライアイの改善、目の疲れの軽減、潤いの補給',
        sideEffects: 'まれに刺激感やかゆみが生じることがあります',
        goodFor: 'ドライアイ、VDT症候群、目の疲れ',
      },
      {
        language: 'en',
        name: 'Hyalein S',
        description: 'Eye drops with hyaluronic acid for gentle care of dry and tired eyes',
        effects: 'Improves dry eyes, reduces eye fatigue, provides moisture',
        sideEffects: 'May rarely cause irritation or itching',
        goodFor: 'Dry eyes, VDT syndrome, eye fatigue',
      },
    ],
    tags: ['eye-care', 'dry-eyes', 'hyaluronic-acid', 'fatigue'],
  },
  {
    id: 'prod_003',
    category: 'health',
    pointValue: 100,
    texts: [
      {
        language: 'ja',
        name: 'うるおいアイドロップ',
        description: '涙に近い成分で目をやさしく潤す目薬',
        effects: '目の乾き、充血、かすみ目の改善',
        sideEffects: '刺激感が生じることがまれにあります',
        goodFor: 'ドライアイ、目の乾燥、パソコン作業後',
      },
      {
        language: 'en',
        name: 'Uruoi Eye Drops',
        description: 'Eye drops with tear-like composition for gentle moisture',
        effects: 'Relieves dry eyes, redness, and blurred vision',
        sideEffects: 'May rarely cause irritation',
        goodFor: 'Dry eyes, eye dryness, after computer work',
      },
    ],
    tags: ['eye-care', 'moisture', 'dry-eyes', 'computer-use'],
  },
  {
    id: 'prod_004',
    category: 'health',
    pointValue: 80,
    texts: [
      {
        language: 'ja',
        name: 'ぽかぽか温感パッチ',
        description: '患部を温めて血行を促進する温感パッチ。肩こりや腰痛に',
        effects: '血行促進、筋肉のこりや痛みの緩和',
        sideEffects: '肌の弱い方は発赤やかゆみが生じることがあります',
        goodFor: '肩こり、腰痛、筋肉痛、冷え性',
      },
      {
        language: 'en',
        name: 'Pokapoka Warming Patch',
        description: 'Warming patch that promotes blood circulation for stiff shoulders and lower back pain',
        effects: 'Promotes blood circulation, relieves muscle stiffness and pain',
        sideEffects: 'May cause redness or itching in those with sensitive skin',
        goodFor: 'Stiff shoulders, lower back pain, muscle pain, poor circulation',
      },
    ],
    tags: ['warming', 'pain-relief', 'muscle', 'circulation'],
  },
  {
    id: 'prod_005',
    category: 'health',
    pointValue: 110,
    texts: [
      {
        language: 'ja',
        name: 'うるおい素肌ローション',
        description: '保湿成分配合のボディローション。乾燥肌をしっとりと保護',
        effects: '肌の保湿、乾燥による痒みの軽減、肌荒れの予防',
        sideEffects: 'まれにアレルギー反応が生じることがあります',
        goodFor: '乾燥肌、肌荒れ、入浴後の保湿',
      },
      {
        language: 'en',
        name: 'Uruoi Skin Lotion',
        description: 'Body lotion with moisturizing ingredients that protects dry skin',
        effects: 'Moisturizes skin, reduces dryness-related itching, prevents rough skin',
        sideEffects: 'May rarely cause allergic reactions',
        goodFor: 'Dry skin, rough skin, post-bath moisturizing',
      },
    ],
    tags: ['moisturizer', 'body-care', 'dry-skin', 'hydration'],
  },
];

console.log('📦 Adding real Japanese health products...\n');

// Insert products
const productStmt = db.prepare(`
  INSERT INTO Product (id, category, pointValue, contentUpdatedAt, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const textStmt = db.prepare(`
  INSERT INTO ProductText (productId, language, name, description, effects, sideEffects, goodFor)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const tagStmt = db.prepare(`
  INSERT OR IGNORE INTO Tag (name) VALUES (?)
`);

const getTagIdStmt = db.prepare(`
  SELECT id FROM Tag WHERE name = ?
`);

const productTagStmt = db.prepare(`
  INSERT INTO ProductTag (productId, tagId)
  VALUES (?, ?)
`);

for (const product of products) {
  const now = new Date().toISOString();

  // Insert product
  productStmt.run(product.id, product.category, product.pointValue, now, now, now);

  // Insert texts
  for (const text of product.texts) {
    textStmt.run(
      product.id,
      text.language,
      text.name,
      text.description,
      text.effects,
      text.sideEffects,
      text.goodFor
    );
  }

  // Insert tags
  for (const tag of product.tags) {
    tagStmt.run(tag);
    const tagId = getTagIdStmt.get(tag).id;
    productTagStmt.run(product.id, tagId);
  }

  const jaText = product.texts.find(t => t.language === 'ja');
  console.log(`  ✓ ${jaText.name} (${product.category}, ${product.pointValue} pts)`);
}

console.log('\n📊 Database Statistics:');
const stats = {
  products: db.prepare('SELECT COUNT(*) as count FROM Product').get().count,
  health: db.prepare("SELECT COUNT(*) as count FROM Product WHERE category = 'health'").get().count,
  cosmetic: db.prepare("SELECT COUNT(*) as count FROM Product WHERE category = 'cosmetic'").get().count,
  tags: db.prepare('SELECT COUNT(*) as count FROM Tag').get().count,
};

console.log(`  Total Products: ${stats.products}`);
console.log(`  Health: ${stats.health}`);
console.log(`  Cosmetic: ${stats.cosmetic}`);
console.log(`  Total Tags: ${stats.tags}`);

console.log('\n✅ Real Japanese health products added successfully!');

db.close();
