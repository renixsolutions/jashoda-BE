const path = require('path');
const knexfile = require(path.join(__dirname, '../../knexfile'));
const env = require('./env');

module.exports = knexfile[env.env] || knexfile.development;

