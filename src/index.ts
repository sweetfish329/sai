import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { Mastra, Agent } from '@mastra/core'
import { readSgfTool } from './tools/sgf'
import { generateBoardImageTool } from './tools/imageGen'

import { cors } from 'hono/cors'

import { serveStatic } from '@hono/node-server/serve-static'
import fs from 'fs'
import path from 'path'

const app = new Hono()

app.get('/config', (c) => {
  return c.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID,
  })
})

app.use('/*', cors())

// Mastra initialization is done dynamically in the /analyze endpoint
// to support per-user authentication with Google OAuth.



import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { OAuth2Client } from 'google-auth-library'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set')
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'postmessage')

app.post('/auth/exchange', async (c) => {
  try {
    const { code } = await c.req.json()
    if (!code) {
      return c.json({ error: 'Missing code' }, 400)
    }

    const { tokens } = await client.getToken(code)
    return c.json(tokens)
  } catch (error: any) {
    console.error('Token exchange error:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.post('/analyze', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Missing Authorization header' }, 401)
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return c.json({ error: 'Invalid Authorization header' }, 401)
    }

    // Verify the access token
    try {
      await client.getTokenInfo(token)
    } catch (e) {
      return c.json({ error: 'Invalid access token' }, 401)
    }

    // Create a Google provider instance with the user's access token
    // We pass the access token in the Authorization header
    const google = createGoogleGenerativeAI({
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    const body = await c.req.text()
    if (!body) {
      return c.json({ error: 'Empty body' }, 400)
    }

    const agent = new Agent({
      name: 'Sai',
      instructions:
        'You are Sai, a Go AI coach. You analyze SGF files and provide feedback. You can also generate images of the board to illustrate your points using the generateBoardImage tool.',
      model: google('gemini-1.5-pro'),
      tools: {
        readSgf: readSgfTool,
        generateBoardImage: generateBoardImageTool,
      },
    })

    const response = await agent.generate([
      {
        role: 'user',
        content: `Please analyze this Go game record (SGF). Use the readSgf tool to parse it.
        
        SGF Content:
        ${body}
        
        Provide a summary of the game and any advice.`,
      },
    ])

    return c.json({ result: response.text })
  } catch (error: any) {
    console.error(error)
    return c.json({ error: error.message }, 500)
  }
})

const port = 3000
console.log(`Server is running on port ${port}`)

// Serve static files from frontend/dist
app.use('/*', serveStatic({ root: './frontend/dist' }))

// Fallback for SPA routing (if file not found, serve index.html)
app.use('*', serveStatic({ path: './frontend/dist/index.html' }))

serve({
  fetch: app.fetch,
  port,
})
