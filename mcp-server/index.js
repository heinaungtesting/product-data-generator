#!/usr/bin/env node

/**
 * Claude MCP Server for PDG Bundle Generation
 * Automatically builds and publishes product bundles to GitHub Pages
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { buildBundle, publishToGitHub } from './build-bundle.js';

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
        name: 'pdg.bundle.generate',
        description: 'Build PDG gzip bundle from repo /data and publish to GitHub Pages',
        inputSchema: {
          type: 'object',
          properties: {
            schemaVersion: {
              type: 'string',
              description: 'Schema version for the bundle (default: latest)',
            },
            compress: {
              type: 'boolean',
              description: 'Whether to gzip compress the bundle (default: true)',
              default: true,
            },
            publish: {
              type: 'boolean',
              description: 'Whether to publish to GitHub Pages (default: true)',
              default: true,
            },
          },
        },
      },
      {
        name: 'pdg.bundle.status',
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
      case 'pdg.bundle.generate': {
        const {
          schemaVersion = '2024.10.26',
          compress = true,
          publish = true,
        } = args || {};

        console.error('[MCP] Building bundle...');

        const bundle = await buildBundle({
          schemaVersion,
          compress,
        });

        let bundleUrl = null;
        let publishResult = null;

        if (publish) {
          console.error('[MCP] Publishing to GitHub Pages...');
          publishResult = await publishToGitHub(bundle);
          bundleUrl = publishResult.url;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                etag: bundle.etag,
                bundle_url: bundleUrl,
                product_count: bundle.productCount,
                size_bytes: bundle.sizeBytes,
                compressed: compress,
                published: publish,
                message: 'Bundle generated successfully',
              }, null, 2),
            },
          ],
        };
      }

      case 'pdg.bundle.status': {
        const fs = await import('fs/promises');
        const path = await import('path');

        try {
          const metaPath = path.join(process.cwd(), 'data', 'meta.json');
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  last_build: meta.lastBuild || null,
                  etag: meta.etag || null,
                  product_count: meta.productCount || 0,
                  schema_version: meta.schemaVersion || null,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'No bundle metadata found',
                  message: 'Run pdg.bundle.generate first',
                }, null, 2),
              },
            ],
          };
        }
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
  console.error('PDG MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
