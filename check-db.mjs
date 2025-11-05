import Database from 'better-sqlite3';

const db = Database('prisma/dev.db', { readonly: true });

const products = db.prepare(`
  SELECT p.id, pt.language, pt.name
  FROM Product p
  JOIN ProductText pt ON p.id = pt.productId
  WHERE pt.language = 'ja'
  ORDER BY p.id
`).all();

console.log('Products in database (Japanese names):');
products.forEach(p => console.log(`  ${p.id}: ${p.name}`));

db.close();
