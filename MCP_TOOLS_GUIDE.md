# MCP Tools Quick Reference

## Available MCP Servers

### 1. myapp-query (Read-Only)
Query tools for browsing products:
- `query-products` - Search/filter products
- `query-product-by-id` - Get product details
- `query-product-stats` - Database statistics
- `query-tags` - List all tags

### 2. product-data-generator (Read-Write)
Product management tools:
- `product-add` - Create new products
- `product-update` - Update products (ANY language)
- `product-delete` - Delete products
- `bundle-generate` - Trigger bundle generation
- `bundle-status` - Check bundle status

---

## Multi-Language Product Workflow

### Step 1: Create Product (English)
Use `product-add`:
```json
{
  "id": "prod-vitamin-c",
  "category": "health",
  "pointValue": 50,
  "name": "Vitamin C 1000mg",
  "description": "Premium vitamin C supplement for daily health",
  "effects": "Boosts immune system, powerful antioxidant, supports collagen production",
  "sideEffects": "May cause digestive discomfort in high doses. Consult doctor if pregnant.",
  "goodFor": "Adults seeking immune support and antioxidant protection",
  "features": ["1000mg per tablet", "Non-GMO", "Gluten-free", "Vegan"],
  "usage": "Take 1 tablet daily with food",
  "ingredients": "Ascorbic Acid (Vitamin C) 1000mg, Cellulose, Stearic Acid",
  "warnings": "Do not exceed recommended dose. Keep out of reach of children.",
  "tags": ["immune-support", "antioxidant", "vitamin"],
  "lang": "en"
}
```

### Step 2: Add Japanese Translation
Use `product-update`:
```json
{
  "id": "prod-vitamin-c",
  "lang": "ja",
  "name": "ビタミンC 1000mg",
  "description": "毎日の健康のためのプレミアムビタミンCサプリメント",
  "effects": "免疫システムを強化し、強力な抗酸化作用があり、コラーゲン生成をサポートします",
  "sideEffects": "大量摂取すると消化不良を引き起こす可能性があります。妊娠中の方は医師にご相談ください。",
  "goodFor": "免疫サポートと抗酸化保護を求める成人",
  "features": ["1錠あたり1000mg", "非遺伝子組み換え", "グルテンフリー", "ビーガン"],
  "usage": "食事と一緒に1日1錠お飲みください",
  "ingredients": "アスコルビン酸（ビタミンC）1000mg、セルロース、ステアリン酸",
  "warnings": "推奨用量を超えないでください。お子様の手の届かないところに保管してください。"
}
```

### Step 3: Add Chinese Translation
Use `product-update`:
```json
{
  "id": "prod-vitamin-c",
  "lang": "zh",
  "name": "维生素C 1000毫克",
  "description": "日常健康的优质维生素C补充剂",
  "effects": "增强免疫系统，强大的抗氧化剂，支持胶原蛋白生成",
  "sideEffects": "大剂量可能引起消化不适。孕妇请咨询医生。",
  "goodFor": "寻求免疫支持和抗氧化保护的成年人",
  "features": ["每片1000毫克", "非转基因", "无麸质", "纯素食"],
  "usage": "每天随餐服用1片",
  "ingredients": "抗坏血酸（维生素C）1000毫克、纤维素、硬脂酸",
  "warnings": "请勿超过推荐剂量。请放在儿童接触不到的地方。"
}
```

### Step 4: Update Specific Fields
Update only what's needed (e.g., point value or specific text):
```json
{
  "id": "prod-vitamin-c",
  "pointValue": 75
}
```

Or update text for a specific language:
```json
{
  "id": "prod-vitamin-c",
  "lang": "en",
  "effects": "Clinically proven immune support with 1000mg of pure vitamin C"
}
```

---

## Field Mapping (camelCase ↔ snake_case)

| Claude Desktop (Input) | Supabase Database |
|------------------------|-------------------|
| `sideEffects`          | `side_effects`    |
| `goodFor`              | `good_for`        |
| `janCode`              | `jan_code`        |
| `pointValue`           | `point_value`     |

All other fields use the same name.

---

## Supported Languages

Use ISO 639-1 language codes:
- `en` - English
- `ja` - Japanese (日本語)
- `zh` - Chinese (中文)
- `ko` - Korean (한국어)
- `es` - Spanish (Español)
- `fr` - French (Français)
- `de` - German (Deutsch)
- etc.

---

## Important Notes

1. **Auto Bundle Generation**: Both `product-add` and `product-update` automatically trigger bundle regeneration
2. **Upsert Behavior**: `product-update` creates new language entries if they don't exist
3. **Partial Updates**: Only provide fields you want to change
4. **Point Values**: Optional numeric field for product points/rewards
5. **Required Fields**:
   - `product-add`: `id`, `category`, `name`
   - `product-update`: `id`, `lang` (lang required only when updating text fields)

---

## Next Steps

**Restart Claude Desktop** to load the updated MCP server with these new capabilities!
