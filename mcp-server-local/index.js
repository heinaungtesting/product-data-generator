#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get PDG project path from environment or use parent directory
const PDG_PATH = process.env.PDG_PATH || path.resolve(__dirname, '..');
const DATABASE_URL = process.env.DATABASE_URL || `file:${path.join(PDG_PATH, 'prisma', 'dev.db')}`;

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// Maximum products limit
const MAX_PRODUCTS = 100;

// Helper function to execute git commands
function executeGitCommit(action, details = '') {
  try {
    const message = `Update via MCP: ${action}${details ? ' - ' + details : ''}`;

    // Change to PDG directory
    process.chdir(PDG_PATH);

    // Check if there are changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.trim()) {
      console.log('No changes to commit');
      return { success: true, message: 'No changes detected' };
    }

    // Add database file
    execSync('git add prisma/dev.db', { encoding: 'utf8' });

    // Commit
    execSync(`git commit -m "${message}"`, { encoding: 'utf8' });
    console.log(`Committed: ${message}`);

    // Push to remote
    execSync('git push origin main', { encoding: 'utf8' });
    console.log('Pushed to GitHub');

    return { success: true, message: `Changes committed and pushed: ${message}` };
  } catch (error) {
    console.error('Git operation failed:', error.message);
    return { success: false, error: `Git operation failed: ${error.message}` };
  }
}

// Helper to validate and create tags
async function ensureTags(tagNames) {
  const tags = [];

  for (const tagName of tagNames) {
    // Find or create tag
    let tag = await prisma.tag.findUnique({
      where: { name: tagName }
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: tagName }
      });
    }

    tags.push(tag);
  }

  return tags;
}

// Helper to format product for display
function formatProduct(product) {
  const textsByLang = {};
  product.texts.forEach(text => {
    textsByLang[text.language] = {
      name: text.name,
      description: text.description,
      effects: text.effects,
      sideEffects: text.sideEffects,
      goodFor: text.goodFor
    };
  });

  return {
    id: product.id,
    category: product.category,
    pointValue: product.pointValue,
    texts: textsByLang,
    tags: product.tags ? product.tags.map(pt => pt.tag.name) : [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

// Initialize MCP Server
const server = new Server(
  {
    name: 'pdg-mcp-server',
    version: '1.0.0',
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
        name: 'create_product',
        description: 'Create a new product in the PDG database with multilingual content. Supports 5 languages: en, ja, th, ko, zh. Auto-commits to GitHub.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['health', 'cosmetic'],
              description: 'Product category'
            },
            pointValue: {
              type: 'number',
              description: 'Point value for the product (positive integer)'
            },
            texts: {
              type: 'object',
              description: 'Multilingual product content. At least one language required.',
              properties: {
                en: { $ref: '#/definitions/productText' },
                ja: { $ref: '#/definitions/productText' },
                th: { $ref: '#/definitions/productText' },
                ko: { $ref: '#/definitions/productText' },
                zh: { $ref: '#/definitions/productText' }
              },
              additionalProperties: false
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of tag names (will be created if they don\'t exist)'
            }
          },
          required: ['category', 'pointValue', 'texts'],
          definitions: {
            productText: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Product name' },
                description: { type: 'string', description: 'Product description' },
                effects: { type: 'string', description: 'Product effects' },
                sideEffects: { type: 'string', description: 'Side effects' },
                goodFor: { type: 'string', description: 'What the product is good for' }
              },
              required: ['name', 'description', 'effects', 'sideEffects', 'goodFor']
            }
          }
        }
      },
      {
        name: 'update_product',
        description: 'Update an existing product by ID. Can update category, pointValue, texts, or tags. Auto-commits to GitHub.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID (UUID)'
            },
            category: {
              type: 'string',
              enum: ['health', 'cosmetic'],
              description: 'Product category (optional)'
            },
            pointValue: {
              type: 'number',
              description: 'Point value (optional)'
            },
            texts: {
              type: 'object',
              description: 'Multilingual content updates (optional). Only provided languages will be updated.',
              properties: {
                en: { $ref: '#/definitions/productText' },
                ja: { $ref: '#/definitions/productText' },
                th: { $ref: '#/definitions/productText' },
                ko: { $ref: '#/definitions/productText' },
                zh: { $ref: '#/definitions/productText' }
              }
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Replace all tags with this array (optional)'
            }
          },
          required: ['id'],
          definitions: {
            productText: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                effects: { type: 'string' },
                sideEffects: { type: 'string' },
                goodFor: { type: 'string' }
              },
              required: ['name', 'description', 'effects', 'sideEffects', 'goodFor']
            }
          }
        }
      },
      {
        name: 'delete_product',
        description: 'Delete a product by ID. This permanently removes the product and all associated data. Auto-commits to GitHub.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID (UUID)'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'list_products',
        description: 'List recent products with optional limit and category filter.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of products to return (default: 10)',
              default: 10
            },
            category: {
              type: 'string',
              enum: ['health', 'cosmetic'],
              description: 'Filter by category (optional)'
            }
          }
        }
      },
      {
        name: 'search_products',
        description: 'Search products by name, description, or tags. Searches across all languages.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search term'
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 20)',
              default: 20
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_stats',
        description: 'Get database statistics including total count, category breakdown, and recent activity.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_product',
        description: 'Get detailed information about a specific product by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID (UUID)'
            }
          },
          required: ['id']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_product': {
        // Check product limit
        const count = await prisma.product.count();
        if (count >= MAX_PRODUCTS) {
          return {
            content: [{
              type: 'text',
              text: `Error: Cannot create product. Maximum limit of ${MAX_PRODUCTS} products reached. Please delete some products first.`
            }]
          };
        }

        // Validate texts
        if (!args.texts || Object.keys(args.texts).length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'Error: At least one language text is required (en, ja, th, ko, or zh)'
            }]
          };
        }

        // Create product with texts in transaction
        const product = await prisma.$transaction(async (tx) => {
          // Create product
          const newProduct = await tx.product.create({
            data: {
              category: args.category,
              pointValue: args.pointValue,
              contentUpdatedAt: new Date()
            }
          });

          // Create texts for each provided language
          const textPromises = Object.entries(args.texts).map(([lang, content]) => {
            return tx.productText.create({
              data: {
                productId: newProduct.id,
                language: lang,
                name: content.name,
                description: content.description,
                effects: content.effects,
                sideEffects: content.sideEffects,
                goodFor: content.goodFor
              }
            });
          });

          await Promise.all(textPromises);

          // Handle tags if provided
          if (args.tags && args.tags.length > 0) {
            const tags = await ensureTags(args.tags);

            const tagPromises = tags.map(tag => {
              return tx.productTag.create({
                data: {
                  productId: newProduct.id,
                  tagId: tag.id
                }
              });
            });

            await Promise.all(tagPromises);
          }

          // Fetch complete product with relations
          return tx.product.findUnique({
            where: { id: newProduct.id },
            include: {
              texts: true,
              tags: {
                include: {
                  tag: true
                }
              }
            }
          });
        });

        // Auto-commit to git
        const productName = args.texts.en?.name || args.texts.ja?.name || Object.values(args.texts)[0].name;
        const gitResult = executeGitCommit('Create product', productName);

        const formatted = formatProduct(product);
        return {
          content: [{
            type: 'text',
            text: `✅ Product created successfully!\n\nID: ${formatted.id}\nCategory: ${formatted.category}\nPoint Value: ${formatted.pointValue}\nLanguages: ${Object.keys(formatted.texts).join(', ')}\nTags: ${formatted.tags.join(', ') || 'none'}\n\n${gitResult.success ? '✅ Changes committed and pushed to GitHub' : '⚠️  ' + gitResult.error}`
          }]
        };
      }

      case 'update_product': {
        // Check if product exists
        const existing = await prisma.product.findUnique({
          where: { id: args.id },
          include: { texts: true, tags: { include: { tag: true } } }
        });

        if (!existing) {
          return {
            content: [{
              type: 'text',
              text: `Error: Product with ID ${args.id} not found`
            }]
          };
        }

        // Update product in transaction
        const updated = await prisma.$transaction(async (tx) => {
          // Update basic fields if provided
          const updateData = {};
          if (args.category) updateData.category = args.category;
          if (args.pointValue !== undefined) updateData.pointValue = args.pointValue;
          if (Object.keys(updateData).length > 0) {
            updateData.contentUpdatedAt = new Date();
          }

          if (Object.keys(updateData).length > 0) {
            await tx.product.update({
              where: { id: args.id },
              data: updateData
            });
          }

          // Update texts if provided
          if (args.texts) {
            for (const [lang, content] of Object.entries(args.texts)) {
              await tx.productText.upsert({
                where: {
                  productId_language: {
                    productId: args.id,
                    language: lang
                  }
                },
                update: {
                  name: content.name,
                  description: content.description,
                  effects: content.effects,
                  sideEffects: content.sideEffects,
                  goodFor: content.goodFor
                },
                create: {
                  productId: args.id,
                  language: lang,
                  name: content.name,
                  description: content.description,
                  effects: content.effects,
                  sideEffects: content.sideEffects,
                  goodFor: content.goodFor
                }
              });
            }

            await tx.product.update({
              where: { id: args.id },
              data: { contentUpdatedAt: new Date() }
            });
          }

          // Update tags if provided
          if (args.tags !== undefined) {
            // Delete existing tags
            await tx.productTag.deleteMany({
              where: { productId: args.id }
            });

            // Add new tags
            if (args.tags.length > 0) {
              const tags = await ensureTags(args.tags);

              const tagPromises = tags.map(tag => {
                return tx.productTag.create({
                  data: {
                    productId: args.id,
                    tagId: tag.id
                  }
                });
              });

              await Promise.all(tagPromises);
            }
          }

          // Fetch updated product
          return tx.product.findUnique({
            where: { id: args.id },
            include: {
              texts: true,
              tags: {
                include: {
                  tag: true
                }
              }
            }
          });
        });

        // Auto-commit to git
        const productName = updated.texts.find(t => t.language === 'en')?.name || updated.texts[0]?.name || args.id;
        const gitResult = executeGitCommit('Update product', productName);

        const formatted = formatProduct(updated);
        return {
          content: [{
            type: 'text',
            text: `✅ Product updated successfully!\n\nID: ${formatted.id}\nCategory: ${formatted.category}\nPoint Value: ${formatted.pointValue}\nLanguages: ${Object.keys(formatted.texts).join(', ')}\nTags: ${formatted.tags.join(', ') || 'none'}\n\n${gitResult.success ? '✅ Changes committed and pushed to GitHub' : '⚠️  ' + gitResult.error}`
          }]
        };
      }

      case 'delete_product': {
        // Check if product exists
        const existing = await prisma.product.findUnique({
          where: { id: args.id },
          include: { texts: true }
        });

        if (!existing) {
          return {
            content: [{
              type: 'text',
              text: `Error: Product with ID ${args.id} not found`
            }]
          };
        }

        const productName = existing.texts.find(t => t.language === 'en')?.name || existing.texts[0]?.name || args.id;

        // Delete product (cascade will handle texts and tags)
        await prisma.product.delete({
          where: { id: args.id }
        });

        // Auto-commit to git
        const gitResult = executeGitCommit('Delete product', productName);

        return {
          content: [{
            type: 'text',
            text: `✅ Product deleted successfully!\n\nDeleted: ${productName} (${args.id})\n\n${gitResult.success ? '✅ Changes committed and pushed to GitHub' : '⚠️  ' + gitResult.error}`
          }]
        };
      }

      case 'list_products': {
        const limit = args.limit || 10;
        const where = args.category ? { category: args.category } : {};

        const products = await prisma.product.findMany({
          where,
          include: {
            texts: true,
            tags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        });

        if (products.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No products found.'
            }]
          };
        }

        const formatted = products.map(formatProduct);
        const output = formatted.map(p => {
          const enName = p.texts.en?.name || Object.values(p.texts)[0]?.name || 'Unnamed';
          return `- ${enName} (${p.category}, ${p.pointValue} pts) [${p.id}]\n  Languages: ${Object.keys(p.texts).join(', ')}\n  Tags: ${p.tags.join(', ') || 'none'}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `📦 Found ${products.length} product(s):\n\n${output}`
          }]
        };
      }

      case 'search_products': {
        const query = args.query.toLowerCase();
        const limit = args.limit || 20;

        // Search in product texts
        const products = await prisma.product.findMany({
          include: {
            texts: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        });

        // Filter products that match query in name, description, or tags
        const matches = products.filter(product => {
          const matchInTexts = product.texts.some(text =>
            text.name.toLowerCase().includes(query) ||
            text.description.toLowerCase().includes(query) ||
            text.effects.toLowerCase().includes(query) ||
            text.goodFor.toLowerCase().includes(query)
          );

          const matchInTags = product.tags.some(pt =>
            pt.tag.name.toLowerCase().includes(query)
          );

          return matchInTexts || matchInTags;
        }).slice(0, limit);

        if (matches.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No products found matching "${args.query}"`
            }]
          };
        }

        const formatted = matches.map(formatProduct);
        const output = formatted.map(p => {
          const enName = p.texts.en?.name || Object.values(p.texts)[0]?.name || 'Unnamed';
          return `- ${enName} (${p.category}, ${p.pointValue} pts) [${p.id}]\n  Languages: ${Object.keys(p.texts).join(', ')}\n  Tags: ${p.tags.join(', ') || 'none'}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `🔍 Found ${matches.length} product(s) matching "${args.query}":\n\n${output}`
          }]
        };
      }

      case 'get_stats': {
        const totalCount = await prisma.product.count();
        const healthCount = await prisma.product.count({ where: { category: 'health' } });
        const cosmeticCount = await prisma.product.count({ where: { category: 'cosmetic' } });
        const tagCount = await prisma.tag.count();

        const recentProducts = await prisma.product.findMany({
          include: { texts: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        const recentList = recentProducts.map(p => {
          const enName = p.texts.find(t => t.language === 'en')?.name || p.texts[0]?.name || 'Unnamed';
          return `  - ${enName} (${p.category})`;
        }).join('\n');

        return {
          content: [{
            type: 'text',
            text: `📊 Database Statistics:\n\nTotal Products: ${totalCount}/${MAX_PRODUCTS}\n  Health: ${healthCount}\n  Cosmetic: ${cosmeticCount}\nTotal Tags: ${tagCount}\n\nRecent Products:\n${recentList || '  (none)'}`
          }]
        };
      }

      case 'get_product': {
        const product = await prisma.product.findUnique({
          where: { id: args.id },
          include: {
            texts: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        });

        if (!product) {
          return {
            content: [{
              type: 'text',
              text: `Error: Product with ID ${args.id} not found`
            }]
          };
        }

        const formatted = formatProduct(product);

        // Format detailed output
        const textOutput = Object.entries(formatted.texts).map(([lang, content]) => {
          return `\n${lang.toUpperCase()}:\n  Name: ${content.name}\n  Description: ${content.description}\n  Effects: ${content.effects}\n  Side Effects: ${content.sideEffects}\n  Good For: ${content.goodFor}`;
        }).join('\n');

        return {
          content: [{
            type: 'text',
            text: `📦 Product Details:\n\nID: ${formatted.id}\nCategory: ${formatted.category}\nPoint Value: ${formatted.pointValue}\nCreated: ${new Date(formatted.createdAt).toLocaleString()}\nUpdated: ${new Date(formatted.updatedAt).toLocaleString()}\nTags: ${formatted.tags.join(', ') || 'none'}${textOutput}`
          }]
        };
      }

      default:
        return {
          content: [{
            type: 'text',
            text: `Error: Unknown tool: ${name}`
          }]
        };
    }
  } catch (error) {
    console.error(`Error executing ${name}:`, error);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}\n\nStack: ${error.stack}`
      }]
    };
  }
});

// Start server
async function main() {
  console.error('PDG MCP Server starting...');
  console.error(`Database: ${DATABASE_URL}`);
  console.error(`PDG Path: ${PDG_PATH}`);

  // Test database connection
  try {
    await prisma.$connect();
    console.error('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 PDG MCP Server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.error('\nShutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\nShutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
