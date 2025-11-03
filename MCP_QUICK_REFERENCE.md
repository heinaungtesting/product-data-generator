# MCP Quick Reference Card

Quick commands and examples for using PDG MCP Server with Claude Desktop.

## 🚀 Create Product

```
Create a health product:
- English name: "Vitamin C 1000mg"
- Japanese name: "ビタミンC 1000mg"
- Thai name: "วิตามินซี 1000mg"
- Korean name: "비타민 C 1000mg"
- Chinese name: "维生素C 1000毫克"
- Point value: 100
- Description: "High-potency vitamin C supplement"
- Effects: "Supports immune system, antioxidant"
- Side effects: "May cause digestive upset"
- Good for: "Immune support, skin health"
- Category: health
- Tags: ["vitamin", "immune", "supplement"]
```

## 🔄 Update Product

```
Update product <product-id>:
- Change point value to 120
- Update English description to "Premium vitamin C"
```

## 🗑️ Delete Product

```
Delete product <product-id>
```

## 🔍 Search

```
Search for products containing "vitamin"
```

## 📋 List Products

```
List the 10 most recent products
```

```
List all health products
```

## 📊 Statistics

```
Show me database statistics
```

```
How many products do I have?
```

## 🔎 Get Product Details

```
Show me details for product <product-id>
```

## 💡 Tips

### Minimum Required for Creation

You must provide at least:
- Category (health or cosmetic)
- Point value (number)
- At least ONE language with all text fields:
  - name
  - description
  - effects
  - sideEffects
  - goodFor

### Language Codes

- `en` - English
- `ja` - Japanese (日本語)
- `th` - Thai (ไทย)
- `ko` - Korean (한국어)
- `zh` - Chinese (中文)

### Categories

- `health` - Health products
- `cosmetic` - Cosmetic products

### Tags

- Lowercase, hyphenated: `vitamin-c`, `skin-care`
- Auto-created if they don't exist
- Multiple tags: `["vitamin", "immune", "health"]`

### Point Values

- Must be positive integers
- Typical range: 50-200
- Represents product value/importance

## ⚡ What Happens After Each Command

### Write Operations (create/update/delete)

1. ✅ Database updated
2. ✅ Git commit created
3. ✅ Changes pushed to GitHub
4. ⏱️ GitHub Actions triggered (30 sec)
5. ⏱️ Bundle regenerated (30 sec)
6. ⏱️ Deployed to GitHub Pages (30 sec)
7. ⏱️ MyApp can sync (immediate)

**Total time: ~1-2 minutes**

### Read Operations (list/search/stats)

- ✅ Instant response
- ❌ No git commits
- ❌ No deployments

## 🐛 Troubleshooting Quick Fixes

### "Maximum products reached"

```
How many products do I have?
# Then delete some:
Delete product <id>
```

### "Product not found"

```
List recent products
# Get the correct ID from the list
```

### "Git operation failed"

Check git status:
```bash
cd /path/to/pdg
git status
git pull origin main
```

### "Database connection failed"

Regenerate Prisma client:
```bash
npx prisma generate
```

## 📚 Full Documentation

- [MCP_SETUP.md](./MCP_SETUP.md) - Complete setup guide
- [mcp-server-local/README.md](./mcp-server-local/README.md) - Server details
- [README.md](./README.md) - Project overview

## 🎯 Common Workflows

### Bulk Product Creation

```
Create 5 vitamin products for me:
1. Vitamin C 1000mg (100 points)
2. Vitamin D3 (80 points)
3. Vitamin E (90 points)
4. B-Complex (110 points)
5. Multivitamin (150 points)

All should be health category with appropriate descriptions.
```

### Product Audit

```
List all products
Show me statistics
Search for products with no tags
```

### Quick Updates

```
Update all vitamin products to increase point values by 10%
```

### Cleanup

```
List products with less than 50 points
Delete the products you just listed
```

---

**Pro Tip:** Be specific and provide all required fields. Claude will ask for missing information if needed.
