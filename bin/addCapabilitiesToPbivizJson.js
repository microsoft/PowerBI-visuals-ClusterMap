'use strict';

const path = require('path');
const pbivizJson = require('../pbiviz.json');
const capabilities = require(path.join('../', pbivizJson.capabilities));

const main = () => {
    pbivizJson.capabilities = capabilities;
    process.stdout.write(JSON.stringify(pbivizJson, null, 2));
}

main();
