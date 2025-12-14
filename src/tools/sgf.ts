import { parse } from '@sabaki/sgf'
import { createTool } from '@mastra/core'
import { z } from 'zod'

export const readSgfTool = createTool({
  id: 'readSgf',
  description: 'Read and parse an SGF file content to extract game information.',
  inputSchema: z.object({
    sgfContent: z.string().describe('The content of the SGF file to parse'),
  }),
  execute: async ({ context }) => {
    const { sgfContent } = context
    try {
      const rootNodes = parse(sgfContent)
      if (!rootNodes || rootNodes.length === 0) {
        return { error: 'No game found in SGF content' }
      }

      const root = rootNodes[0]
      const gameInfo = {
        blackPlayer: root.data.PB ? root.data.PB[0] : 'Unknown',
        whitePlayer: root.data.PW ? root.data.PW[0] : 'Unknown',
        result: root.data.RE ? root.data.RE[0] : 'Unknown',
        komi: root.data.KM ? root.data.KM[0] : 'Unknown',
        size: root.data.SZ ? root.data.SZ[0] : 'Unknown',
        handicap: root.data.HA ? root.data.HA[0] : '0',
        comment: root.data.C ? root.data.C[0] : '',
      }

      // Extract moves (simplified)
      const moves = []
      let currentNode = root
      while (currentNode.children && currentNode.children.length > 0) {
        currentNode = currentNode.children[0]
        if (currentNode.data.B) {
          moves.push({
            color: 'B',
            move: currentNode.data.B[0],
            comment: currentNode.data.C ? currentNode.data.C[0] : undefined,
          })
        } else if (currentNode.data.W) {
          moves.push({
            color: 'W',
            move: currentNode.data.W[0],
            comment: currentNode.data.C ? currentNode.data.C[0] : undefined,
          })
        }
      }

      return {
        gameInfo,
        movesCount: moves.length,
        moves: moves.slice(0, 20), // Return first 20 moves to avoid huge context, or maybe summary
        // We might want to return all moves if the LLM needs to analyze the whole game.
        // For now let's return all but maybe simplified?
        // Actually, let's return all moves but keep it concise.
        allMoves: moves,
      }
    } catch (error: any) {
      return { error: `Failed to parse SGF: ${error.message}` }
    }
  },
})
