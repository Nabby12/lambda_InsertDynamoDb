'use strict'

const fs = require('fs');
const chai = require('chai');
const assert = chai.assert;
const lambda = require('../../../src/handlers/index.js');

async function getEnv() {
    const envData = await JSON.parse(fs.readFileSync('.../../env.json'));
    return envData.insertDynamoDb;
};
describe('Test for index', async () => {
    const env = await getEnv();
    it('DynamoDBにデータが追加されるか', async () => {
        console.log(env.DYNAMO_TABLE_NAME);
    });
});