'use strict'

const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

const DYNAMO_TABLE_NAME = process.env['DYNAMO_TABLE_NAME'];

async function scanDynamo(){
    const params = {
        TableName: DYNAMO_TABLE_NAME,
        Select: 'COUNT',
        ScanIndexForward: false,
    };

    let response;
    await dynamo.scan(params).promise().then(data => {
        console.log("scan succeeded.");
        response = data.ScannedCount;
    }).catch(err => {
        console.error("scan failed. Error JSON:", JSON.stringify(err, null, 2));
        response = -1;
    });

    return response;
}

async function putDynamo(item) {
    let params = {
        TableName: DYNAMO_TABLE_NAME,
        Item: item
        };
    
    let response;
    await dynamo.put(params).promise().then(() => {
        console.log("putItem succeeded.");
        response = {'isOk': true};
    }).catch(err => {
        console.error("unable to put item. Error JSON:", JSON.stringify(err, null, 2));
        response = {'isOk': false};
    });

    return response;
}

module.exports = {
    scanDynamo,
    putDynamo
};