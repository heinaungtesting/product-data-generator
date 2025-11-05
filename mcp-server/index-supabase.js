#!/usr/bin/env node

/**
 * Claude MCP Server for Product Data Generator (Supabase Edition)
 * Uses Supabase instead of SQLite/Prisma for real-time bundle generation
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

const server = new Server(
  {
    name: 'pdg-mcp-server-supabase',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'product.add',
        description: 'Add a new product to the Supabase database (auto-triggers bundle generation)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique product ID (e.g., "prod-001")',
            },
            category: {
              type: 'string',
              description: 'Product category (e.g., "health", "beauty")',
            },
            janCode: {
              type: 'string',
              description: 'JAN barcode (optional)',
            },
            name: {
              type: 'string',
              description: 'Product name',
            },
            description: {
              type: 'string',
              description: 'Product description (optional)',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: "en")',
              default: 'en',
            },
            tags: {
              type: 'array',
              description: 'Array of tag IDs (optional)',
              items: { type: 'string' },
            },
            features: {
              type: 'array',
              description: 'Array of product features (optional)',
              items: { type: 'string' },
            },
            usage: {
              type: 'string',
              description: 'Usage instructions (optional)',
            },
            ingredients: {
              type: 'string',
              description: 'Ingredients list (optional)',
            },
            warnings: {
              type: 'string',
              description: 'Warnings or precautions (optional)',
            },
          },
          required: ['id', 'category', 'name'],
        },
      },
      {
        name: 'product.list',
        description: 'List all products from Supabase',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of products to return (default: 50)',
              default: 50,
            },
            category: {
              type: 'string',
              description: 'Filter by category (optional)',
            },
          },
        },
      },
      {
        name: 'product.update',
        description: 'Update an existing product (auto-triggers bundle regeneration)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID to update',
            },
            category: {
              type: 'string',
              description: 'New category (optional)',
            },
            janCode: {
              type: 'string',
              description: 'New JAN code (optional)',
            },
            name: {
              type: 'string',
              description: 'New name (optional)',
            },
            description: {
              type: 'string',
              description: 'New description (optional)',
            },
            lang: {
              type: 'string',
              description: 'Language code for text update (default: "en")',
              default: 'en',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'product.delete',
        description: 'Delete a product (auto-triggers bundle regeneration)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID to delete',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'bundle.generate',
        description: 'Manually trigger bundle generation (usually automatic)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'bundle.status',
        description: 'Get current bundle status and metadata',
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
      case 'product.add': {
        const {
          id,
          category,
          janCode,
          name: productName,
          description,
          lang = 'en',
          tags = [],
          features,
          usage,
          ingredients,
          warnings,
        } = args;

        // Insert product
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            id,
            category,
            jan_code: janCode || null,
            barcode: janCode || null,
          })
          .select()
          .single();

        if (productError) {
          throw new Error(`Failed to create product: ${productError.message}`);
        }

        // Insert product text
        const { error: textError } = await supabase
          .from('product_texts')
          .insert({
            product_id: id,
            lang,
            name: productName,
            description: description || null,
            features: features ? JSON.stringify(features) : null,
            usage: usage || null,
            ingredients: ingredients || null,
            warnings: warnings || null,
          });

        if (textError) {
          throw new Error(`Failed to create product text: ${textError.message}`);
        }

        // Insert tags if provided
        if (tags.length > 0) {
          // Ensure tags exist
          for (const tagId of tags) {
            await supabase
              .from('tags')
              .insert({ id: tagId })
              .onConflict('id')
              .ignore();
          }

          // Link tags to product
          const tagLinks = tags.map(tagId => ({
            product_id: id,
            tag_id: tagId,
          }));

          const { error: tagError } = await supabase
            .from('product_tags')
            .insert(tagLinks);

          if (tagError) {
            throw new Error(`Failed to link tags: ${tagError.message}`);
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Product created successfully. Bundle regeneration triggered automatically.',
                product: {
                  id,
                  category,
                  name: productName,
                  tags,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'product.list': {
        const { limit = 50, category } = args || {};

        let query = supabase
          .from('products')
          .select(`
            *,
            product_texts (*),
            product_tags (
              tags (id)
            )
          `)
          .order('updated_at', { ascending: false })
          .limit(limit);

        if (category) {
          query = query.eq('category', category);
        }

        const { data: products, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch products: ${error.message}`);
        }

        // Transform products
        const transformedProducts = products.map(p => ({
          id: p.id,
          category: p.category,
          janCode: p.jan_code,
          texts: p.product_texts?.map(t => ({
            lang: t.lang,
            name: t.name,
            description: t.description,
          })) || [],
          tags: p.product_tags?.map(pt => pt.tags.id) || [],
          updatedAt: p.updated_at,
        }));

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

      case 'product.update': {
        const { id, category, janCode, name: productName, description, lang = 'en' } = args;

        // Update product if category or janCode provided
        if (category || janCode) {
          const updates = {};
          if (category) updates.category = category;
          if (janCode) updates.jan_code = janCode;

          const { error: productError } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id);

          if (productError) {
            throw new Error(`Failed to update product: ${productError.message}`);
          }
        }

        // Update product text if name or description provided
        if (productName || description) {
          const updates = {};
          if (productName) updates.name = productName;
          if (description) updates.description = description;

          const { error: textError } = await supabase
            .from('product_texts')
            .update(updates)
            .eq('product_id', id)
            .eq('lang', lang);

          if (textError) {
            throw new Error(`Failed to update product text: ${textError.message}`);
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Product updated successfully. Bundle regeneration triggered automatically.',
                productId: id,
              }, null, 2),
            },
          ],
        };
      }

      case 'product.delete': {
        const { id } = args;

        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) {
          throw new Error(`Failed to delete product: ${error.message}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Product deleted successfully. Bundle regeneration triggered automatically.',
                productId: id,
              }, null, 2),
            },
          ],
        };
      }

      case 'bundle.generate': {
        console.error('[MCP] Manually triggering bundle generation...');

        // Call Edge Function
        const { data, error } = await supabase.functions.invoke('generate-bundle', {
          body: { trigger: 'manual' },
        });

        if (error) {
          throw new Error(`Failed to generate bundle: ${error.message}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                ...data,
                message: 'Bundle generated successfully',
              }, null, 2),
            },
          ],
        };
      }

      case 'bundle.status': {
        // Get latest bundle metadata
        const { data: metadata, error } = await supabase
          .from('bundle_metadata')
          .select('*')
          .order('built_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
          throw new Error(`Failed to fetch bundle status: ${error.message}`);
        }

        if (!metadata) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  message: 'No bundle generated yet',
                  product_count: 0,
                }, null, 2),
              },
            ],
          };
        }

        // Get bundle URL
        const { data: urlData } = supabase.storage
          .from('bundles')
          .getPublicUrl(metadata.storage_path);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                etag: metadata.etag,
                product_count: metadata.product_count,
                built_at: metadata.built_at,
                size_bytes: metadata.size_bytes,
                schema_version: metadata.schema_version,
                url: urlData.publicUrl,
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
            error: error.message,
            success: false,
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
  console.error('PDG MCP Server (Supabase) running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
