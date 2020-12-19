'use strict'

const googleSheetsModule = require('./googleSheetsModule.js');
const dynamoDbModule = require('./dynamoDbModule.js');

exports.handler = async () => {  
    let diary_id_array = await getDiaryIdArray();

    let phrase_array = await googleSheetsModule.getSpreadSheetPhrase();
    let jan_phrase_array = getJanPhraseArray(phrase_array[0]);
    let eng_phrase_array = getEngPhraseArray(phrase_array[1]);

    let response;
    await Promise.all(diary_id_array.map(async (element, index) => {
        let item = {
            jan_phrase: jan_phrase_array[index],
            post_flg: "0",
            diary_id: element,
            eng_phrase: eng_phrase_array[index]
        };

        response = await dynamoDbModule.putDynamo(item);
    }));

    return response;
}

async function getDiaryIdArray() {
    let record_count = await dynamoDbModule.scanDynamo();

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