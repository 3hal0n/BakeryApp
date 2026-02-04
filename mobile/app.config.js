const fs = require('fs');
const path = require('path');

// Load environment variables from mobile/.env if present
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Read existing app.json to preserve metadata
const appJsonPath = path.resolve(__dirname, 'app.json');
const baseConfig = fs.existsSync(appJsonPath) ? require(appJsonPath) : { expo: {} };

baseConfig.expo = baseConfig.expo || {};
baseConfig.expo.extra = baseConfig.expo.extra || {};

// Allow overriding API_URL from mobile/.env (API_URL) or fallback to Render URL
baseConfig.expo.extra.API_URL = process.env.API_URL || baseConfig.expo.extra.API_URL || 'https://bakeryapp-backend-l87q.onrender.com';

module.exports = baseConfig;
