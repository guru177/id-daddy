
const http = require('http');

async function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => resData += chunk);
      res.on('end', () => resolve(JSON.parse(resData)));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function test() {
  const loginRes = await post('/auth/login', { email: 'owner@example.com', password: 'password123' });
  const { accessToken } = loginRes;
  console.log('Token:', accessToken ? 'GOT IT' : 'FAILED');

  const res = await post('/templates', {
    name: 'Admin Test Design',
    design: { objects: [] }
  }, accessToken);
  
  console.log('Result:', res);
}

test().catch(console.error);
