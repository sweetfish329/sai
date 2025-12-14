import { spawn } from 'child_process'
import path from 'path'

async function testMcpServer() {
  const serverPath = path.join(process.cwd(), 'dist', 'mcp-server.js')
  console.log(`Starting MCP server from: ${serverPath}`)

  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
  })

  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  }

  return new Promise<void>((resolve, reject) => {
    let buffer = ''

    serverProcess.stdout.on('data', (data) => {
      buffer += data.toString()
      const lines = buffer.split('\n')

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const response = JSON.parse(line)
          if (response.id === 1 && response.result) {
            console.log('Received valid response:', JSON.stringify(response, null, 2))
            const tools = response.result.tools
            const hasReadSgf = tools.some((t: any) => t.name === 'readSgf')
            const hasGenImage = tools.some((t: any) => t.name === 'generateBoardImage')

            if (hasReadSgf && hasGenImage) {
              console.log('Test Passed: Both tools are listed.')
              serverProcess.kill()
              resolve()
            } else {
              console.error('Test Failed: Missing tools.')
              serverProcess.kill()
              reject(new Error('Missing tools'))
            }
            return
          }
        } catch (e) {
          // Partial line or non-JSON, ignore
        }
      }
    })

    serverProcess.on('error', (err) => {
      console.error('Server process error:', err)
      reject(err)
    })

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Server exited with code ${code}`)
        reject(new Error(`Server exited with code ${code}`))
      }
    })

    // Send request
    const input = JSON.stringify(request) + '\n'
    serverProcess.stdin.write(input)
  })
}

testMcpServer().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
