'use strict'

const LINE_CHANNEL_SECRET = process.env['LINE_CHANNEL_SECRET'];
const LINE_HEADER = process.env['LINE_HEADER'];
const LINE_CHANNEL_ACCESS_TOKEN = process.env['LINE_CHANNEL_ACCESS_TOKEN'];
const LINE_TRIGGER_WORD = process.env['LINE_TRIGGER_WORD'];

const LINE = require('@line/bot-sdk');
const CRYPTO = require('crypto');
const CLIENT = new LINE.Client({ channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN });

function authorize(event) {
    let signature;
    try {
        signature = CRYPTO.createHmac('sha256', LINE_CHANNEL_SECRET).update(event.body).digest('base64');
        console.log('get signature succeeded.');
    } catch (err) {
        console.log('get signature failed.');
        console.log(err);
    };

    const headerSignature = event.headers[LINE_HEADER];
    
    let result;
    if (signature === headerSignature) {
        result = { 'isOk': true };
    } else {
        result = { 'isOk': false };
    };
    
    return result;
}

function validateText(event){
    const eventBody = JSON.parse(event.body);
    const sendText = eventBody.events[0].message.text;

    let result;
    if (sendText === LINE_TRIGGER_WORD) {
        result = { 'isMatch': true };
    } else {
        result = { 'isMatch': false };
    };
    
    return result;
}

async function reply(event, context, replyMessage) {
    const eventBody = JSON.parse(event.body);
    const message = {
        'type': 'text',
        'text': replyMessage
    };

    let result;
    await CLIENT.replyMessage(eventBody.events[0].replyToken, message).then(response => { 
        let lambdaResponse = {
            statusCode: 200,
            headers: { "X-Line-Status" : "OK"},
            body: '{"result":"completed"}'
        };
        console.log(response);
        console.log('send to line succeeded.');
        context.succeed(lambdaResponse);
        
        result = { 'isOk': true };
    }).catch(err =>{
        console.log('send to line failed.');
        console.log(err);

        result = { 'isOk': false };
    });

    return result;
}

module.exports = {
    authorize,
    validateText,
    reply
};