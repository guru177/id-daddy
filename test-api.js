const http = require('http');

async function test() {
  try {
    const loginRes = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.accessToken) return;

    const createRes = await fetch('http://localhost:4000/templates', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.accessToken}`
      },
      body: JSON.stringify({
        name: 123,
        design: {
          id: 'test'
        }
      })
    });
    
    const createData = await createRes.text();
    console.log('Create:', createData);
  } catch (e) {
    console.error(e);
  }
}

test();
