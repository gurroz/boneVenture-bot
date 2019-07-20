
'use strict';

// Hierarchical node.js configuration with command-line arguments, environment
// variables, and files.
const nconf = (module.exports = require('nconf'));
const path = require('path');

nconf
// 1. Command-line arguments
    .argv()
    // 2. Environment variables
    .env(['CLOUD_BUCKET', 'NODE_ENV', 'PORT'])
    // 3. Config file
    .file({file: path.join(__dirname, 'config.json')})
    // 4. Defaults
    .defaults({
        // Typically you will create a bucket with the same name as your project ID.
        CLOUD_BUCKET: '',

        PORT: 8080,
    });

// Check for required settings
checkConfig('CLOUD_BUCKET');

function checkConfig(setting) {
    if (!nconf.get(setting)) {
        throw new Error(
            `You must set ${setting} as an environment variable or in config.json!`
        );
    }
}