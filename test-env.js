const { loadEnv } = require('vite');
const env = loadEnv('development', '.', '');
console.log(env.GEMINI_API_KEY);
