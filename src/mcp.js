import readline from 'node:readline';
import { pruneRepository } from './index.js';

/**
 * Native Model Context Protocol (MCP) Server for ContextPrune
 * Allows Claude Desktop, Cursor, and Windsurf to prune codebases dynamically
 * via standard JSON-RPC over stdio.
 */

const SERVER_INFO = {
  name: 'contextprune-mcp',
  version: '1.2.0'
};

const TOOLS = [
  {
    name: 'prune_repository',
    description: 'Optimizes a codebase into a lean, type-safe prompt by skeletonizing non-target dependencies and omitting unrelated code.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Description of the task or feature to implement (e.g. "fix stripe webhook payment verification")'
        },
        path: {
          type: 'string',
          description: 'Absolute or relative path to the project root directory (defaults to current working directory)'
        },
        maxTokens: {
          type: 'number',
          description: 'Strict token budget limit (e.g. 8000 for small local context windows)'
        },
        format: {
          type: 'string',
          enum: ['xml', 'markdown'],
          description: 'Output format (default: xml for Claude, markdown for GPT)'
        }
      },
      required: ['task']
    }
  }
];

export function startMcpServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  function sendResponse(id, result, error = null) {
    const payload = {
      jsonrpc: '2.0',
      id
    };
    if (error) {
      payload.error = error;
    } else {
      payload.result = result;
    }
    process.stdout.write(JSON.stringify(payload) + '\n');
  }

  rl.on('line', async (line) => {
    if (!line.trim()) return;

    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }

    const { id, method, params } = message;

    switch (method) {
      case 'initialize':
        sendResponse(id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: SERVER_INFO
        });
        break;

      case 'notifications/initialized':
        // Acknowledge initialization
        break;

      case 'ping':
        sendResponse(id, {});
        break;

      case 'tools/list':
        sendResponse(id, {
          tools: TOOLS
        });
        break;

      case 'tools/call':
        if (params?.name === 'prune_repository') {
          const args = params.arguments || {};
          try {
            const result = await pruneRepository(args.path || process.cwd(), {
              task: args.task || '',
              maxTokens: args.maxTokens,
              format: args.format || 'xml',
              copy: false
            });

            sendResponse(id, {
              content: [
                {
                  type: 'text',
                  text: result.output
                }
              ],
              _meta: {
                savings: result.savings,
                filesIncluded: result.filesIncluded,
                filesSkeletonized: result.filesSkeletonized,
                totalFiles: result.totalFiles
              }
            });
          } catch (err) {
            sendResponse(id, null, {
              code: -32603,
              message: `ContextPrune failed: ${err.message}`
            });
          }
        } else {
          sendResponse(id, null, {
            code: -32601,
            message: `Tool not found: ${params?.name}`
          });
        }
        break;

      default:
        if (id) {
          sendResponse(id, null, {
            code: -32601,
            message: `Method not supported: ${method}`
          });
        }
        break;
    }
  });

  process.stderr.write(`ContextPrune MCP Server v${SERVER_INFO.version} running on stdio...\n`);
}
