#!/usr/bin/env node
/**
 * MCP Server for MyApp - Query Tools
 * Provides read-only query tools for products from Supabase
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create MCP server
const server = new Server(
  {
    name: 'myapp-query-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query-products',
        description: 'Query products from Supabase with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category (e.g., "health", "cosmetic")',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of products to return (default: 50)',
              default: 50,
            },
            search: {
              type: 'string',
              description: 'Search query for product name',
            },
            lang: {
              type: 'string',
              description: 'Language code for text (default: "en")',
              default: 'en',
            },
          },
        },
      },
      {
        name: 'query-product-by-id',
        description: 'Get a specific product by ID with all details',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID',
            },
            lang: {
              type: 'string',
              description: 'Language code for text (default: "en")',
              default: 'en',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'query_product_stats',
        description: 'Get statistics about products in the database',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'query_tags',
        description: 'Get all available tags',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_products': {
        const {
          category,
          tags,
          limit: rawLimit,
          search,
          lang = 'en',
        } = (args ?? {}) as {
          category?: string;
          tags?: string[];
          limit?: unknown;
          search?: string;
          lang?: string;
        };

        const limit =
          typeof rawLimit === 'number' && Number.isFinite(rawLimit)
            ? Math.max(1, Math.min(rawLimit, 100))
            : 50;

        let query = supabase
          .from('products')
          .select(`
            *,
            product_texts!inner (
              lang,
              name,
              description,
              effects,
              side_effects,
              good_for
            ),
            product_tags (
              tags (id)
            )
          `)
          .eq('product_texts.lang', lang)
          .order('updated_at', { ascending: false })
          .limit(limit);

        if (category) {
          query = query.eq('category', category);
        }

        const { data: products, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch products: ${error.message}`);
        }

        // Transform and filter products
        type ProductTagRow = {
          tags?: {
            id?: string | number;
          } | null;
        } | null;
        
        let transformedProducts = products.map((p: {
          id: string;
          category: string;
          point_value?: number;
          jan_code?: string;
          product_texts?: Array<{
            lang?: string;
            name?: string;
            description?: string;
            effects?: string;
            side_effects?: string;
            good_for?: string;
          }>;
          product_tags?: Array<ProductTagRow> | null;
          updated_at?: string;
        }) => {
          const tags =
            Array.isArray(p.product_tags)
              ? (p.product_tags
                  .map((pt: ProductTagRow) => pt?.tags?.id)
                  .filter(
                    (value): value is string | number =>
                      value !== undefined && value !== null
                  ) ?? [])
              : [];
          const text = p.product_texts?.[0] || {};
          return {
            id: p.id,
            category: p.category,
            pointValue: p.point_value,
            janCode: p.jan_code,
            name: text.name || 'Unnamed',
            description: text.description || '',
            effects: text.effects || '',
            sideEffects: text.side_effects || '',
            goodFor: text.good_for || '',
            tags,
            updatedAt: p.updated_at,
          };
        });

        // Apply tag filter if specified
        if (tags && Array.isArray(tags) && tags.length > 0) {
          transformedProducts = transformedProducts.filter(p =>
            tags.every(tag => p.tags.includes(tag))
          );
        }

        // Apply search filter if specified
        if (search) {
          const searchLower = search.toLowerCase();
          transformedProducts = transformedProducts.filter(p =>
            p.name.toLowerCase().includes(searchLower)
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: transformedProducts.length,
                products: transformedProducts,
              }, null, 2),
            },
          ],
        };
      }

      case 'query-product-by-id': {
        const { id, lang = 'en' } = (args ?? {}) as { id?: string; lang?: string };

        if (!id) {
          throw new Error('Product ID is required');
        }

        const { data: product, error } = await supabase
          .from('products')
          .select(`
            *,
            product_texts!inner (
              lang,
              name,
              description,
              effects,
              side_effects,
              good_for,
              features,
              usage,
              ingredients,
              warnings
            ),
            product_tags (
              tags (id)
            )
          `)
          .eq('id', id)
          .eq('product_texts.lang', lang)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    error: `Product with ID "${id}" not found`,
                  }, null, 2),
                },
              ],
            };
          }
          throw new Error(`Failed to fetch product: ${error.message}`);
        }

        const text = product.product_texts?.[0] || {};
        const transformedProduct = {
          id: product.id,
          category: product.category,
          pointValue: product.point_value,
          janCode: product.jan_code,
          name: text.name || 'Unnamed',
          description: text.description || '',
          effects: text.effects || '',
          sideEffects: text.side_effects || '',
          goodFor: text.good_for || '',
          features: text.features ? JSON.parse(text.features) : [],
          usage: text.usage || '',
          ingredients: text.ingredients || '',
          warnings: text.warnings || '',
          tags: product.product_tags?.map((pt: { tags: { id: unknown; }; }) => {
            return pt.tags?.id;
          }).filter(Boolean) || [],
          updatedAt: product.updated_at,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                product: transformedProduct,
              }, null, 2),
            },
          ],
        };
      }

      case 'query_product_stats': {
        // Get total product count
        const { count: totalCount, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          throw new Error(`Failed to get product count: ${countError.message}`);
        }

        // Get category breakdown
        const { data: categories, error: catError } = await supabase
          .from('products')
          .select('category');

        if (catError) {
          throw new Error(`Failed to get categories: ${catError.message}`);
        }

        const categoryBreakdown = categories.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Get all tags with counts
        const { data: productTags, error: tagError } = await supabase
          .from('product_tags')
          .select('tag_id');

        if (tagError) {
          throw new Error(`Failed to get tags: ${tagError.message}`);
        }

        const tagCounts = productTags.reduce((acc, pt) => {
          acc[pt.tag_id] = (acc[pt.tag_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([tag, count]) => ({ tag, count }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                stats: {
                  totalProducts: totalCount,
                  categoryBreakdown,
                  topTags,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'query_tags': {
        const { data: tags, error } = await supabase
          .from('tags')
          .select('id')
          .order('id');

        if (error) {
          throw new Error(`Failed to fetch tags: ${error.message}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: tags.length,
                tags: tags.map(t => t.id),
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MyApp Query MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
