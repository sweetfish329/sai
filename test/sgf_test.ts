import { readSgfTool } from '../src/tools/sgf'
import fs from 'fs'
import path from 'path'

async function testSgfTool() {
  const samplePath = path.join(process.cwd(), 'sample', 'sample.sgf')
  console.log(`Reading sample SGF from: ${samplePath}`)

  try {
    const sgfContent = fs.readFileSync(samplePath, 'utf-8')
    const result = (await readSgfTool.execute({
      context: { sgfContent },
      suspend: () => Promise.resolve(),
      runtimeContext: {} as any, // Mock runtime context
    })) as any

    console.log('SGF Parse Result:')
    console.log(JSON.stringify(result, null, 2))

    if (result.error) {
      console.error('Test Failed: SGF parsing returned error.')
      process.exit(1)
    }

    if (result.gameInfo && result.gameInfo.blackPlayer && result.movesCount > 0) {
      console.log('Test Passed: SGF parsed successfully.')
    } else {
      console.error('Test Failed: Missing expected game info.')
      process.exit(1)
    }
  } catch (error) {
    console.error('Test Failed with exception:', error)
    process.exit(1)
  }
}

testSgfTool()
