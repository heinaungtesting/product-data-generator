# MCP Server Setup Guide

Complete guide to setting up and using the PDG MCP Server with Claude Desktop.

---

## 📋 Table of Contents

1. [What is MCP?](#what-is-mcp)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Troubleshooting](#troubleshooting)
7. [Workflow Overview](#workflow-overview)

---

## 🤔 What is MCP?

**Model Context Protocol (MCP)** is a protocol that allows Claude Desktop to interact with external tools and databases. The PDG MCP Server enables Claude to:

- ✅ Create products directly in your PDG database
- ✅ Update existing products
- ✅ Search and list products
- ✅ Delete products
- ✅ Get database statistics
- ✅ **Auto-commit and push changes to GitHub**
- ✅ Trigger automatic bundle deployment to MyApp

**Benefits:**
- No need to use the web UI
- Faster product creation
- Natural language interface
- Automatic version control
- Instant deployment pipeline

---

## ✅ Prerequisites

Before setting up the MCP server, ensure you have:

1. **Node.js 18+** installed
   ```bash
   node --version  # Should be v18 or higher
   ```

2. **Claude Desktop** installed
   - Download from: https://claude.ai/download

3. **PDG Repository** cloned and set up
   ```bash
   git clone https://github.com/yourusername/product-data-generator.git
   cd product-data-generator
   npm install
   npx prisma generate
   ```

4. **Git configured** with push access to your repository
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```

5. **Database initialized** with at least one product

---

## 🔧 Installation

### Step 1: Install MCP Server Dependencies

```bash
cd mcp-server-local
npm install
```

This installs:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `@prisma/client` - Database client

### Step 2: Generate Prisma Client

```bash
cd ..
npx prisma generate
```

### Step 3: Test the Server

```bash
cd mcp-server-local
node index.js
```

You should see:
```
PDG MCP Server starting...
Database: file:../prisma/dev.db
PDG Path: /path/to/product-data-generator
✅ Database connected successfully
🚀 PDG MCP Server running
```

Press `Ctrl+C` to stop.

---

## ⚙️ Configuration

### Configure Claude Desktop

1. **Open Claude Desktop configuration file:**

   **On macOS:**
   ```bash
   code ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

   **On Windows:**
   ```powershell
   notepad %APPDATA%\Claude\claude_desktop_config.json
   ```

   **On Linux:**
   ```bash
   code ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add the MCP server configuration:**

   ```json
   {
     "mcpServers": {
       "pdg": {
         "command": "node",
         "args": ["/ABSOLUTE/PATH/TO/product-data-generator/mcp-server-local/index.js"],
         "env": {
           "PDG_PATH": "/ABSOLUTE/PATH/TO/product-data-generator",
           "DATABASE_URL": "file:/ABSOLUTE/PATH/TO/product-data-generator/prisma/dev.db"
         }
       }
     }
   }
   ```

   **⚠️ IMPORTANT:** Replace `/ABSOLUTE/PATH/TO/product-data-generator` with your actual path!

   **Example (macOS/Linux):**
   ```json
   {
     "mcpServers": {
       "pdg": {
         "command": "node",
         "args": ["/Users/yourname/projects/product-data-generator/mcp-server-local/index.js"],
         "env": {
           "PDG_PATH": "/Users/yourname/projects/product-data-generator",
           "DATABASE_URL": "file:/Users/yourname/projects/product-data-generator/prisma/dev.db"
         }
       }
     }
   }
   ```

   **Example (Windows):**
   ```json
   {
     "mcpServers": {
       "pdg": {
         "command": "node",
         "args": ["C:\\Users\\YourName\\projects\\product-data-generator\\mcp-server-local\\index.js"],
         "env": {
           "PDG_PATH": "C:\\Users\\YourName\\projects\\product-data-generator",
           "DATABASE_URL": "file:C:\\Users\\YourName\\projects\\product-data-generator\\prisma\\dev.db"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

4. **Verify the server is connected:**
   - Look for a 🔌 icon or "MCP" indicator in Claude Desktop
   - Type: "What tools do you have available?"
   - You should see `create_product`, `update_product`, etc.

---

## 💡 Usage Examples

### Example 1: Create a Health Product

```
Create a health product:
- Name (English): "Vitamin C 1000mg"
- Name (Japanese): "ビタミンC 1000mg"
- Category: health
- Point value: 100
- Description: "High-potency vitamin C supplement for immune support"
- Effects: "Supports immune system, antioxidant protection"
- Side effects: "May cause digestive upset in high doses"
- Good for: "Daily immune support, skin health"
- Tags: ["vitamin", "immune", "health"]
```

**What happens:**
1. Claude calls `create_product` tool
2. Product is added to database
3. MCP server commits: `Update via MCP: Create product - Vitamin C 1000mg`
4. Changes are pushed to GitHub
5. GitHub Actions detects database change
6. Bundle is regenerated from database
7. Bundle is deployed to GitHub Pages
8. MyApp can sync the new product

**Expected response:**
```
✅ Product created successfully!

ID: abc-123-def-456
Category: health
Point Value: 100
Languages: en, ja
Tags: vitamin, immune, health

✅ Changes committed and pushed to GitHub
```

### Example 2: Update a Product

```
Update product abc-123-def-456:
- Change point value to 120
- Update English description to "Premium vitamin C supplement with rose hips"
```

**What happens:**
1. Claude calls `update_product` tool
2. Database is updated
3. Auto-commit and push
4. Bundle regeneration triggered
5. MyApp gets updated product

### Example 3: Search Products

```
Search for products related to "vitamin"
```

**Claude will:**
1. Call `search_products` tool
2. Return matching products with details
3. No database modification, so no git commit

### Example 4: Get Statistics

```
Show me the database statistics
```

**Returns:**
```
📊 Database Statistics:

Total Products: 15/100
  Health: 10
  Cosmetic: 5
Total Tags: 25

Recent Products:
  - Vitamin C 1000mg (health)
  - Face Cream (cosmetic)
  - Omega-3 Fish Oil (health)
  ...
```

### Example 5: List Recent Products

```
List the 5 most recent health products
```

### Example 6: Delete a Product

```
Delete product abc-123-def-456
```

**⚠️ Warning:** This permanently removes the product!

---

## 🔍 Available Tools

The MCP server provides these tools to Claude:

| Tool | Description | Commits to Git? |
|------|-------------|----------------|
| `create_product` | Create new product with multilingual content | ✅ Yes |
| `update_product` | Update existing product by ID | ✅ Yes |
| `delete_product` | Delete product permanently | ✅ Yes |
| `list_products` | List recent products (with optional filters) | ❌ No |
| `search_products` | Search by name, description, or tags | ❌ No |
| `get_stats` | Get database statistics | ❌ No |
| `get_product` | Get detailed product information | ❌ No |

---

## 🐛 Troubleshooting

### Server Not Connecting

**Symptoms:** Claude doesn't see the MCP tools

**Solutions:**
1. Check Claude Desktop config path is correct
2. Verify absolute paths (no `~` or relative paths)
3. Restart Claude Desktop completely
4. Check server logs in Console (macOS) or Event Viewer (Windows)
5. Test server manually:
   ```bash
   cd mcp-server-local
   node index.js
   ```

### Database Connection Failed

**Symptoms:** Server starts but errors on tool calls

**Solutions:**
1. Verify `DATABASE_URL` in config
2. Check database file exists: `ls prisma/dev.db`
3. Run `npx prisma generate` to ensure client is up-to-date
4. Check file permissions on database

### Git Commit Fails

**Symptoms:** Product created but git error shown

**Solutions:**
1. Ensure git is configured:
   ```bash
   git config user.name
   git config user.email
   ```

2. Check you have push access:
   ```bash
   git push origin main
   ```

3. Ensure working directory is clean:
   ```bash
   git status
   ```

4. Check if on correct branch:
   ```bash
   git branch --show-current  # Should be 'main'
   ```

### Maximum Products Reached

**Symptoms:** "Cannot create product. Maximum limit of 100 products reached"

**Solution:**
Delete some products first:
```
Delete product <product-id>
```

Or increase the limit in `mcp-server-local/index.js`:
```javascript
const MAX_PRODUCTS = 200;  // Change from 100
```

### Bundle Not Updating on GitHub Pages

**Symptoms:** MCP changes work, but MyApp doesn't see updates

**Solutions:**
1. Check GitHub Actions ran successfully:
   - Go to your repo → Actions tab
   - Look for "Publish PDG Bundle" workflow
   - Check if it succeeded

2. Verify database file was committed:
   ```bash
   git log --oneline | head -5
   ```
   You should see commits like "Update via MCP: ..."

3. Check bundle URL is accessible:
   ```bash
   curl -I https://yourusername.github.io/product-data-generator/bundle.json.gz
   ```

4. Manually trigger workflow:
   - Go to Actions → Publish PDG Bundle → Run workflow

---

## 🔄 Workflow Overview

Here's the complete flow when you create a product via Claude:

```
┌──────────────────────────────────────────────────────────────┐
│ 1. You talk to Claude Desktop                                │
│    "Create a health product called Vitamin C..."            │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Claude calls MCP tool                                     │
│    Tool: create_product                                      │
│    Params: { category: "health", pointValue: 100, ... }     │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. MCP Server writes to database                            │
│    File: prisma/dev.db (SQLite)                             │
│    Action: INSERT INTO Product ...                          │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. MCP Server auto-commits                                  │
│    $ git add prisma/dev.db                                  │
│    $ git commit -m "Update via MCP: Create product - ..."  │
│    $ git push origin main                                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. GitHub Actions detects database change                   │
│    Trigger: on push to prisma/dev.db                        │
│    Job: build-and-publish                                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Bundle generator reads from Prisma                       │
│    Source: Prisma database (not NDJSON)                     │
│    Output: bundle.json.gz + etag.txt                        │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Bundle deployed to GitHub Pages                          │
│    URL: https://you.github.io/repo/bundle.json.gz          │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. MyApp syncs bundle via ETag                              │
│    - Checks ETag (304 if unchanged)                         │
│    - Downloads new bundle if changed                        │
│    - Updates IndexedDB                                      │
│    - Shows new product in UI                                │
└──────────────────────────────────────────────────────────────┘

⏱️  Total time: ~1-2 minutes from creation to MyApp sync
```

---

## 🎯 Best Practices

### 1. Always Provide Complete Information

**Good:**
```
Create a health product:
- English name: "Vitamin D3"
- Japanese name: "ビタミンD3"
- Description: "Supports bone health and immune function"
- Effects: "Maintains calcium levels, supports immune system"
- Side effects: "Rare: hypercalcemia if overdosed"
- Good for: "Bone health, immune support, mood regulation"
- Point value: 80
- Tags: ["vitamin", "bone-health", "immune"]
```

**Bad:**
```
Create a vitamin D product
```
(Missing required fields will cause errors)

### 2. Use Consistent Tag Names

Keep tags lowercase and hyphenated:
- ✅ "vitamin-c", "immune-support", "skin-care"
- ❌ "Vitamin C", "Immune_Support", "skincare"

### 3. Verify Changes

After creating/updating products:
```
List the 5 most recent products
```

### 4. Monitor GitHub Actions

Check that workflows succeed:
- Go to your repo → Actions
- Look for green checkmarks ✅

### 5. Test in MyApp

After changes:
1. Open MyApp
2. Go to Settings
3. Tap "Sync Now"
4. Verify the new/updated product appears

---

## 🚨 Fallback: Using Web UI

If the MCP server fails or you prefer the GUI:

1. Open PDG web UI: `http://localhost:3000`
2. Login with your credentials
3. Use the "Add Product" button
4. Fill in the form manually
5. Save

The product will still trigger bundle regeneration via the normal web flow.

---

## 📊 Comparison: MCP vs Web UI

| Feature | MCP Server | Web UI |
|---------|-----------|---------|
| **Speed** | Very fast (natural language) | Slower (manual forms) |
| **Convenience** | High (talk to Claude) | Medium (click through UI) |
| **Bulk operations** | Excellent | Limited |
| **Learning curve** | Low (natural language) | Low (visual interface) |
| **Automation** | Full (via Claude scripts) | None |
| **Offline use** | Requires Claude Desktop | Works without Claude |
| **Git commits** | Automatic | Must commit manually |

**Recommendation:** Use MCP for bulk operations and quick edits. Use Web UI for visual review and complex formatting.

---

## 📝 Next Steps

1. ✅ Configure Claude Desktop
2. ✅ Test creating a product
3. ✅ Verify git commits work
4. ✅ Check GitHub Actions succeeds
5. ✅ Test MyApp sync
6. 🚀 Start managing products with Claude!

---

## 🆘 Need Help?

- **Issues:** Open a GitHub issue in your repository
- **Questions:** Check the main [README.md](./README.md)
- **Deployment:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Quick start:** See [QUICK_START.md](./QUICK_START.md)

---

**Made with ❤️ for developers who want to manage products with AI.**
