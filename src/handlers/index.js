'use strict'

const googleSheetsModule = require('./googleSheetsModule.js');

const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

const DYNAMO_TABLE_NAME = process.env['DYNAMO_TABLE_NAME'];

exports.handler = async () => {  
    let diary_id_array = await getDiaryIdArray();
    
    let phrase_array = await googleSheetsModule.getSpreadSheetPhrase();
    let jan_phrase_array = getJanPhraseArray(phrase_array[0]);
    let eng_phrase_array = getEngPhraseArray(phrase_array[1]);

    await Promise.all(diary_id_array.map(async (element, index) =>{
        let item = {
            jan_phrase: jan_phrase_array[index],
            post_flg: "0",
            diary_id: element,
            eng_phrase: eng_phrase_array[index]
        };
        let params = {
            TableName: DYNAMO_TABLE_NAME,
            Item: item
            };
        await dynamo.put(params).promise().then(() => {
            console.log("putItem succeeded.");
        }).catch(err => {
            console.error("unable to put item. Error JSON:", JSON.stringify(err, null, 2));
            return;
        });
    }));

    return {'status': 'succeeded'};
}

async function getDiaryIdArray() {
    let record_count = -1;
    
    const params = {
        TableName: DYNAMO_TABLE_NAME,
        Select: 'COUNT',
        ScanIndexForward: false,
    };

    await dynamo.scan(params).promise().then(data => {
        console.log("scan succeeded.");
        record_count = data.ScannedCount;
    }).catch(err => {
        console.error("scan failed. Error JSON:", JSON.stringify(err, null, 2));
    });

    if (record_count !== -1) {
        record_count++;
    };
    
    return  [ record_count ];
}

function getJanPhraseArray(item = '') {
    return  [ item ];
}

function getEngPhraseArray(item = '') {
    return  [ item ];
}