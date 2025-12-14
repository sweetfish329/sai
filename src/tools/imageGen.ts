import { createTool } from '@mastra/core'
import { z } from 'zod'
import { parse } from '@sabaki/sgf'
import { GoBoard } from '../utils/board'
import { Jimp } from 'jimp'

// Helper to convert SGF coordinate (e.g. "aa") to number (0)
function sgfCoordToNum(coord: string): number {
  if (!coord || coord.length < 1) return -1
  const charCode = coord.charCodeAt(0)
  if (charCode >= 97) return charCode - 97 // 'a' is 97
  return -1
}

export const generateBoardImageTool = createTool({
  id: 'generateBoardImage',
  description: 'Generate an image of the Go board at a specific move number from an SGF file.',
  inputSchema: z.object({
    sgfContent: z.string().describe('The content of the SGF file'),
    moveNumber: z
      .number()
      .optional()
      .describe(
        'The move number to generate the image for. If omitted, generates for the last move.',
      ),
  }),
  execute: async ({ context }) => {
    const { sgfContent, moveNumber } = context

    try {
      const rootNodes = parse(sgfContent)
      if (!rootNodes || rootNodes.length === 0) {
        return { error: 'No game found in SGF content' }
      }

      const root = rootNodes[0]
      const size = root.data.SZ ? parseInt(root.data.SZ[0]) : 19
      const board = new GoBoard(size)

      // Extract moves
      const moves: { x: number; y: number; color: 'B' | 'W' }[] = []
      let currentNode = root

      // Handle handicap stones if any (AB/AW in root)
      if (root.data.AB) {
        root.data.AB.forEach((coord: string) => {
          const x = sgfCoordToNum(coord[0])
          const y = sgfCoordToNum(coord[1])
          if (x >= 0 && y >= 0) board.play(x, y, 'B')
        })
      }
      if (root.data.AW) {
        root.data.AW.forEach((coord: string) => {
          const x = sgfCoordToNum(coord[0])
          const y = sgfCoordToNum(coord[1])
          if (x >= 0 && y >= 0) board.play(x, y, 'W')
        })
      }

      while (currentNode.children && currentNode.children.length > 0) {
        currentNode = currentNode.children[0]
        let color: 'B' | 'W' | null = null
        let coord = ''

        if (currentNode.data.B) {
          color = 'B'
          coord = currentNode.data.B[0]
        } else if (currentNode.data.W) {
          color = 'W'
          coord = currentNode.data.W[0]
        }

        if (color && coord) {
          const x = sgfCoordToNum(coord[0])
          const y = sgfCoordToNum(coord[1])
          moves.push({ x, y, color })
        }
      }

      const targetMove = moveNumber !== undefined ? moveNumber : moves.length

      // Replay moves
      for (let i = 0; i < targetMove && i < moves.length; i++) {
        const m = moves[i]
        if (m.x >= 0 && m.y >= 0) {
          board.play(m.x, m.y, m.color)
        }
      }

      // Generate Image
      const cellSize = 40
      const padding = 40
      const imageSize = size * cellSize + padding * 2

      const image = new Jimp({ width: imageSize, height: imageSize, color: 0xdcb35cff }) // Wood color

      // Draw Grid
      const lineColor = 0x000000ff
      for (let i = 0; i < size; i++) {
        const pos = padding + i * cellSize
        // Horizontal
        // image.scan(padding, pos, size * cellSize, 1, (x, y, idx) => { ... }) // Jimp scan is complex, use simple line drawing if available or pixel manipulation
        // Jimp doesn't have simple line drawing. We have to do it manually or use a plugin.
        // For simplicity, let's just set pixels.

        for (let j = 0; j < size * cellSize; j++) {
          image.setPixelColor(lineColor, padding + j, pos) // Horizontal line
          image.setPixelColor(lineColor, pos, padding + j) // Vertical line
        }
      }

      // Draw Stones
      const blackColor = 0x000000ff
      const whiteColor = 0xffffffff
      const radius = cellSize / 2 - 2

      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const stone = board.get(x, y)
          if (stone) {
            const cx = padding + x * cellSize
            const cy = padding + y * cellSize
            const color = stone === 'B' ? blackColor : whiteColor

            // Simple circle drawing
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                  image.setPixelColor(color, cx + dx, cy + dy)
                }
              }
            }
          }
        }
      }

      const buffer = await image.getBuffer('image/png')
      const base64 = buffer.toString('base64')

      return { image: `data:image/png;base64,${base64}` }
    } catch (error: any) {
      return { error: `Failed to generate image: ${error.message}` }
    }
  },
})
