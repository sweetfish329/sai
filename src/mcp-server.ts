import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { readSgfTool } from './tools/sgf.js'
import { generateBoardImageTool } from './tools/imageGen.js'

const server = new Server(
  {
    name: 'sai-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'readSgf',
        description: 'Read and parse an SGF file content to extract game information.',
        inputSchema: {
          type: 'object',
          properties: {
            sgfContent: {
              type: 'string',
              description: 'The content of the SGF file to parse',
            },
          },
          required: ['sgfContent'],
        },
      },
      {
        name: 'generateBoardImage',
        description:
          'Generate an image of the Go board at a specific move number from an SGF file.',
        inputSchema: {
          type: 'object',
          properties: {
            sgfContent: {
              type: 'string',
              description: 'The content of the SGF file',
            },
            moveNumber: {
              type: 'number',
              description:
                'The move number to generate the image for. If omitted, generates for the last move.',
            },
          },
          required: ['sgfContent'],
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (!args) {
    throw new Error('No arguments provided')
  }

  if (name === 'readSgf') {
    const sgfContent = args.sgfContent as string
    const tool = readSgfTool as any
    const result = (await tool.execute({
      context: { sgfContent },
      suspend: () => Promise.resolve(),
      runtimeContext: {} as any,
    })) as any
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  }

  if (name === 'generateBoardImage') {
    const sgfContent = args.sgfContent as string
    const moveNumber = args.moveNumber as number | undefined
    const tool = generateBoardImageTool as any
    const result = (await tool.execute({
      context: { sgfContent, moveNumber },
      suspend: () => Promise.resolve(),
      runtimeContext: {} as any,
    })) as any

    if (result.error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${result.error}`,
          },
        ],
        isError: true,
      }
    }

    if (result.image) {
      return {
        content: [
          {
            type: 'image',
            data: result.image.replace(/^data:image\/png;base64,/, ''),
            mimeType: 'image/png',
          },
        ],
      }
    }

    return {
      content: [{ type: 'text', text: 'No image generated' }],
      isError: true,
    }
  }

  throw new Error(`Unknown tool: ${name}`)
})

async function run() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Sai MCP Server running on stdio')
}

run().catch((error) => {
  console.error('Fatal error running server:', error)
  process.exit(1)
})
