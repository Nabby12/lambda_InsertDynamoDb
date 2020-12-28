'use strict'

const lineModule = require('./lineModule.js');
const googleSheetsModule = require('./googleSheetsModule.js');
const dynamoDbModule = require('./dynamoDbModule.js');

exports.handler = async event => {
    let result;
    let replyStatus;

    const lineAuthorize = await lineModule.authorize(event);
    if (!lineAuthorize.isAuthorize) {
        result = {'status': 'line authorize failed.'};
        replyStatus = await lineModule.reply(event, result.status);
        result.isReply = replyStatus.isReply;
        return result;
    };

    const validateText = await lineModule.validateText(event);
    if (!validateText.isMatch) {
        result = {'status': 'invalid text.'};
        replyStatus = await lineModule.reply(event, result.status);
        result.isReply = replyStatus.isReply;
        return result;
    };

    let diary_id_array = await getDiaryIdArray();
    if (diary_id_array.includes(-1)) {
        result = {'status': 'db scan failed.'};
        replyStatus = await lineModule.reply(event, result.status);
        result.isReply = replyStatus.isReply;
        return result;
    };

    let phraseObject = await googleSheetsModule.getSpreadSheetPhrase();
    if (!phraseObject.isOk){
        result = {'status': phraseObject.content};
        replyStatus = await lineModule.reply(event, result.status);
        result.isReply = replyStatus.isReply;
        return result;
    };

    let jan_phrase_array = getJanPhraseArray(phraseObject.content[0]);
    let eng_phrase_array = getEngPhraseArray(phraseObject.content[1]);

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

    if (response.isOk){
        result = {'status': 'put item succeeded.'};
    } else {
        result = {'status': 'put item failed.'};
    };

    replyStatus = await lineModule.reply(event, result.status);
    result.isReply = replyStatus.isReply;
    return result;
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