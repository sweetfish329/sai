import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

async function testStaticServing() {
  const serverPath = path.join(process.cwd(), 'dist', 'index.js');
  console.log(`Starting server from: ${serverPath}`);

  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  return new Promise<void>((resolve, reject) => {
    let started = false;

    serverProcess.stdout.on('data', async (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('Server is running on port 3000') && !started) {
        started = true;
        console.log('Server started. Verifying static serving...');

        try {
          // Give it a moment to be fully ready
          await new Promise(r => setTimeout(r, 1000));

          // Request root path
          const res = await new Promise<http.IncomingMessage>((resolveReq, rejectReq) => {
            http.get('http://localhost:3000/', (res) => {
              resolveReq(res);
            }).on('error', rejectReq);
          });

          if (res.statusCode === 200) {
             // Check content type or content to ensure it's HTML (from frontend/dist/index.html)
             // Since we don't have the actual build content here easily, status 200 is a good start.
             // Ideally we'd check headers['content-type'] includes 'text/html'.
             if (res.headers['content-type']?.includes('text/html')) {
                 console.log('Test Passed: Root path returns HTML.');
                 serverProcess.kill();
                 resolve();
             } else {
                 console.error(`Test Failed: Content-Type is ${res.headers['content-type']}`);
                 serverProcess.kill();
                 reject(new Error('Invalid Content-Type'));
             }
          } else {
            console.error(`Test Failed: Status code ${res.statusCode}`);
            serverProcess.kill();
            reject(new Error(`Status code ${res.statusCode}`));
          }

        } catch (err) {
          console.error('Request failed:', err);
          serverProcess.kill();
          reject(err);
        }
      }
    });

    serverProcess.on('error', (err) => {
      console.error('Server process error:', err);
      reject(err);
    });
  });
}

testStaticServing().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
