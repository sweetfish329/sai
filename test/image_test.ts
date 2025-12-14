import { generateBoardImageTool } from '../src/tools/imageGen'
import fs from 'fs'
import path from 'path'

async function testImageGen() {
  const samplePath = path.join(process.cwd(), 'sample', 'sample.sgf')
  console.log(`Reading sample SGF from: ${samplePath}`)

  try {
    const sgfContent = fs.readFileSync(samplePath, 'utf-8')

    // Test generating image at move 20
    const result = (await generateBoardImageTool.execute({
      context: { sgfContent, moveNumber: 20 },
      suspend: () => Promise.resolve(),
      runtimeContext: {} as any,
    })) as any

    if (result.error) {
      console.error('Test Failed:', result.error)
      process.exit(1)
    }

    if (result.image && result.image.startsWith('data:image/png;base64,')) {
      console.log('Test Passed: Image generated successfully.')

      // Save to file for manual inspection
      const base64Data = result.image.replace(/^data:image\/png;base64,/, '')
      const outputPath = path.join(process.cwd(), 'test_board.png')
      fs.writeFileSync(outputPath, base64Data, 'base64')
      console.log(`Image saved to: ${outputPath}`)
    } else {
      console.error('Test Failed: No valid image data returned.')
      process.exit(1)
    }
  } catch (error) {
    console.error('Test Failed with exception:', error)
    process.exit(1)
  }
}

testImageGen()
