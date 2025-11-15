# MCP Server Setup for MyApp

This project includes a Model Context Protocol (MCP) server that provides Claude Desktop with direct access to query your Supabase product database.

## What is MCP?

MCP (Model Context Protocol) allows Claude Desktop to interact with your Supabase database through defined tools. This enables:
- Querying products with filters (category, tags, search)
- Getting detailed product information by ID
- Viewing database statistics
- Listing all available tags

## Setup Complete

The MCP server has been configured and added to your Claude Desktop config at:
`~/Library/Application Support/Claude/claude_desktop_config.json`

**Important:** You need to **restart Claude Desktop** to load the new MCP server.

## Available Tools

### 1. query-products
Query products from Supabase with optional filters.

**Parameters:**
- `category` (optional): Filter by "health" or "cosmetic"
- `tags` (optional): Array of tag IDs to filter by
- `limit` (optional): Maximum results (default: 50)
- `search` (optional): Search query for product name
- `lang` (optional): Language code (default: "en")

**Example:**
```json
{
  "category": "health",
  "search": "vitamin",
  "limit": 10,
  "lang": "en"
}
```

### 2. query-product-by-id
Get a specific product by ID with all details.

**Parameters:**
- `id` (required): Product ID
- `lang` (optional): Language code (default: "en")

**Example:**
```json
{
  "id": "prod-001",
  "lang": "ja"
}
```

### 3. query-product-stats
Get statistics about products in the database.

**Returns:**
- Total product count
- Category breakdown (health vs cosmetic)
- Top 10 most used tags

**Example:**
```json
{}
```

### 4. query-tags
Get all available tags in the database.

**Returns:**
- List of all tag IDs
- Total count

**Example:**
```json
{}
```

## Configuration

The MCP server is configured in your Claude Desktop config as:

```json
{
  "mcpServers": {
    "myapp-query": {
      "command": "npx",
      "args": ["tsx", "/Users/apple/testweb/my-app/myapp/mcp-server.ts"],
      "env": {
        "SUPABASE_URL": "https://hqztadklpalhrukkrppg.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[your-key]"
      }
    }
  }
}
```

## Manual Testing

You can test the MCP server directly from the command line:

```bash
cd /Users/apple/testweb/my-app/myapp
SUPABASE_URL="https://hqztadklpalhrukkrppg.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="[your-key]" \
npm run mcp
```

The server communicates via stdio and is designed to be used by Claude Desktop.

## Troubleshooting

### MCP Server Not Showing in Claude Desktop

1. Make sure you've **restarted Claude Desktop** after updating the config
2. Check the config file exists: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Verify the file path in the config is correct: `/Users/apple/testweb/my-app/myapp/mcp-server.ts`

### Connection Errors

1. Verify your Supabase URL and service role key are correct
2. Test the connection by running the server manually (see above)
3. Check that `@modelcontextprotocol/sdk` and `@supabase/supabase-js` are installed:
   ```bash
   npm install --save-dev @modelcontextprotocol/sdk @supabase/supabase-js
   ```

### Query Returns No Results

1. Make sure products exist in your Supabase database
2. Check that product_texts table has entries for the requested language
3. Verify the category and tag filters are correct

## Files

- [mcp-server.ts](mcp-server.ts) - MCP server implementation with Supabase queries
- [scripts/get-products.ts](scripts/get-products.ts) - Alternative script for querying IndexedDB directly (browser-only)

## Security Note

The MCP server uses your Supabase service role key, which has full database access. The server is:
- **Read-only** - Only provides query tools, no write/update/delete operations
- **Local-only** - Runs on your machine, not exposed to the network
- **Secure** - Environment variables are not logged or exposed

For additional security, consider creating a separate Supabase role with read-only permissions.
