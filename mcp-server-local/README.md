# PDG MCP Server (Local)

Model Context Protocol server for Product Data Generator - enables Claude Desktop to directly manage products in your local database.

## What This Does

This MCP server allows Claude Desktop to:
- ✅ Create products with multilingual content
- ✅ Update existing products
- ✅ Delete products
- ✅ Search and list products
- ✅ Get database statistics
- ✅ **Auto-commit and push changes to GitHub**

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pdg": {
      "command": "node",
      "args": ["/absolute/path/to/product-data-generator/mcp-server-local/index.js"],
      "env": {
        "PDG_PATH": "/absolute/path/to/product-data-generator",
        "DATABASE_URL": "file:/absolute/path/to/product-data-generator/prisma/dev.db"
      }
    }
  }
}
```

**Replace `/absolute/path/to` with your actual path!**

### 3. Restart Claude Desktop

The server will automatically start when Claude Desktop launches.

### 4. Test It

In Claude Desktop, try:
```
Create a health product called "Test Product" with 50 points
```

## Available Tools

| Tool | Description |
|------|-------------|
| `create_product` | Create new product (auto-commits to git) |
| `update_product` | Update product by ID (auto-commits) |
| `delete_product` | Delete product by ID (auto-commits) |
| `list_products` | List recent products |
| `search_products` | Search by name/description/tags |
| `get_stats` | Get database statistics |
| `get_product` | Get product details by ID |

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PDG_PATH` | Optional | Path to PDG project | `/Users/name/projects/pdg` |
| `DATABASE_URL` | Optional | Database file path | `file:../prisma/dev.db` |

Defaults to parent directory if not specified.

## How It Works

1. **Claude calls tool** → e.g., `create_product`
2. **Server writes to database** → Prisma Client updates SQLite
3. **Auto-commit** → `git add prisma/dev.db && git commit && git push`
4. **GitHub Actions** → Detects database change
5. **Bundle regeneration** → Reads from Prisma
6. **Deploy to Pages** → MyApp can sync

## Features

- ✅ Full CRUD operations on products
- ✅ Multilingual support (5 languages)
- ✅ Tag management (auto-creates tags)
- ✅ Transaction safety
- ✅ Input validation
- ✅ Automatic git commits
- ✅ 100-product limit enforcement
- ✅ Detailed error messages

## Troubleshooting

### Server not connecting?

1. Check paths are absolute (no `~`)
2. Restart Claude Desktop
3. Test manually: `node index.js`

### Git commits failing?

1. Ensure git is configured:
   ```bash
   git config user.name
   git config user.email
   ```

2. Check you're on main branch:
   ```bash
   git branch --show-current
   ```

### Database errors?

1. Regenerate Prisma client:
   ```bash
   cd ..
   npx prisma generate
   ```

2. Check database exists:
   ```bash
   ls ../prisma/dev.db
   ```

## Complete Documentation

See [MCP_SETUP.md](../MCP_SETUP.md) for comprehensive setup guide and usage examples.

## Tech Stack

- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Database**: Prisma Client + SQLite
- **Git**: `child_process.execSync`
- **Node.js**: 18+

## License

Same as parent PDG project.
