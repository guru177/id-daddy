// Test script to diagnose template sync to DB
async function main() {
  // 1. Login
  const loginRes = await fetch('http://localhost:4000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  if (!loginData.accessToken) {
    console.log('Login failed:', loginData);
    return;
  }
  const token = loginData.accessToken;

  // 2. Check existing templates
  const listRes = await fetch('http://localhost:4000/templates', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log('Existing templates:', listData.total, 'entries');

  // 3. Try creating a template with a simple design object
  const testDesign = { name: 'Test Design', frontData: { objects: [] }, backData: { objects: [] }, config: {} };
  const createRes = await fetch('http://localhost:4000/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test Design', design: testDesign })
  });
  const createData = await createRes.json();
  console.log('Create status:', createRes.status);
  console.log('Create response:', JSON.stringify(createData, null, 2));

  // 4. If it worked, clean it up
  if (createData.id) {
    const delRes = await fetch(`http://localhost:4000/templates/${createData.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Cleanup delete status:', delRes.status);
  }
}

main().catch(console.error);
