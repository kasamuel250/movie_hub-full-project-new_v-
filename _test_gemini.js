require('dotenv').config({ path: require('path').join(__dirname, 'server', '.env') });
const axios = require('axios');
const key = process.env.GEMINI_KEY;
console.log('Testing key:', key?.substring(0, 15) + '...');
axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key,
  { contents: [{ role: 'user', parts: [{ text: 'Say hi' }] }] },
  { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
).then(r => console.log('OK:', r.data?.candidates?.[0]?.content?.parts?.[0]?.text))
 .catch(e => console.error('ERR:', e.response?.status, e.response?.data?.error?.message || e.message));
