const { loadEnv } = require('vite');
const env = loadEnv('development', '.', '');
console.log(env.GEMINI_API_KEY ? 'GEMINI_API_KEY is configured' : 'GEMINI_API_KEY is not configured');
