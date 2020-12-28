'use strict'

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = chai.assert;
const expect = chai.expect;
const proxyquire = require('proxyquire');

const googleSheetsModule = require('../../../src/handlers/googleSheetsModule');
const dynamoDbModule = require('../../../src/handlers/dynamoDbModule');
const { createSandbox } = require('sinon');

describe('Test for index', () => {
    let sandbox;
    let proxyIndex;
    const dummyEvent = {
        "headers": {
            "target-header": "dummySignature"
        },
        "body": '{"events": [{"replyToken": "dummyToken", "message": {"text": "dummyText"}}]}'
    };
    let lineAuthorizeStub;
    let lineValidateTextStub;
    let lineReplyStub;
    let dynamoDBPutStub;
    let dynamoDBScanStub;
    let getSpreadSheetPhraseStub;

    const proxyLineModule = {
        authorize: () => {},
        validateText: () => {},
        reply: () => {},
    }
    beforeEach(() => {
        sandbox = createSandbox();
        
        lineAuthorizeStub = sandbox.stub(proxyLineModule, 'authorize');
        lineValidateTextStub = sandbox.stub(proxyLineModule, 'validateText');
        lineReplyStub = sandbox.stub(proxyLineModule, 'reply');
        proxyIndex = proxyquire('../../../src/handlers/index.js', {
            './lineModule.js': {
                'authorize': lineAuthorizeStub,
                'validateText': lineValidateTextStub,
                'reply': lineReplyStub
            }
        });
        
        dynamoDBScanStub = sandbox.stub(dynamoDbModule, 'scanDynamo');
        dynamoDBPutStub = sandbox.stub(dynamoDbModule, 'putDynamo');
        getSpreadSheetPhraseStub = sandbox.stub(googleSheetsModule, 'getSpreadSheetPhrase');
    });
    afterEach(() => {
        sandbox.restore();

        lineAuthorizeStub.restore();
        lineValidateTextStub.restore();
        lineReplyStub.restore();
        
        dynamoDBScanStub.restore();
        dynamoDBPutStub.restore();
        getSpreadSheetPhraseStub.restore();
    });
    
    it('データ書込成功・返信成功の場合に書込成功・返信成功ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': true });
        lineValidateTextStub.resolves({ 'isMatch': true });
        lineReplyStub.resolves({ 'isReply': true });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(1);
        dynamoDBPutStub.resolves({'isOk': true});

        const expected = {
            'status': 'put item succeeded.',
            'isReply': true,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.calledOnce, true);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.equal(getSpreadSheetPhraseStub.calledOnce, true);
            assert.equal(dynamoDBPutStub.called, true);
            assert.deepEqual(result, expected);
        });
    });

    it('データ書込成功・返信失敗の場合に書込成功・返信失敗ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': true });
        lineValidateTextStub.resolves({ 'isMatch': true });
        lineReplyStub.resolves({ 'isReply': false });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(1);
        dynamoDBPutStub.resolves({'isOk': true});

        const expected = {
            'status': 'put item succeeded.',
            'isReply': false,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.calledOnce, true);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.equal(getSpreadSheetPhraseStub.calledOnce, true);
            assert.equal(dynamoDBPutStub.called, true);
            assert.deepEqual(result, expected);
        });
    });

    it('DynamoDBにデータ追加失敗・返信成功の場合に書込失敗・返信成功ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': true });
        lineValidateTextStub.resolves({ 'isMatch': true });
        lineReplyStub.resolves({ 'isReply': true });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(1);
        dynamoDBPutStub.resolves({'isOk': false});

        const expected = {
            'status': 'put item failed.',
            'isReply': true,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.calledOnce, true);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.equal(getSpreadSheetPhraseStub.calledOnce, true);
            assert.equal(dynamoDBPutStub.called, true);
            assert.deepEqual(result, expected);
        });
    });

    it('DynamoDBにデータ追加失敗・返信失敗の場合に書込失敗・返信失敗ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': true });
        lineValidateTextStub.resolves({ 'isMatch': true });
        lineReplyStub.resolves({ 'isReply': false });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(1);
        dynamoDBPutStub.resolves({'isOk': false});

        const expected = {
            'status': 'put item failed.',
            'isReply': false,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.calledOnce, true);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.equal(getSpreadSheetPhraseStub.calledOnce, true);
            assert.equal(dynamoDBPutStub.called, true);
            assert.deepEqual(result, expected);
        });
    });

    it('DynamoDBのレコード数取得失敗・返信成功の場合にDB読込失敗・返信成功ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': true });
        lineValidateTextStub.resolves({ 'isMatch': true });
        lineReplyStub.resolves({ 'isReply': true });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(-1);
        dynamoDBPutStub.resolves({'isOk': true});

        const expected = {
            'status': 'db scan failed.',
            'isReply': true,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.calledOnce, true);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.equal(getSpreadSheetPhraseStub.called, false);
            assert.equal(dynamoDBPutStub.called, false);
            assert.deepEqual(result, expected);
        });
    });

    it('DynamoDBのレコード数取得失敗・返信失敗の場合にDB読込失敗・返信失敗ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': true });
        lineValidateTextStub.resolves({ 'isMatch': true });
        lineReplyStub.resolves({ 'isReply': false });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(-1);
        dynamoDBPutStub.resolves({'isOk': true});

        const expected = {
            'status': 'db scan failed.',
            'isReply': false,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.calledOnce, true);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.equal(getSpreadSheetPhraseStub.called, false);
            assert.equal(dynamoDBPutStub.called, false);
            assert.deepEqual(result, expected);
        });
    });

    it('キーワード検証失敗・返信成功の場合に検証失敗・返信成功ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': true });
        lineValidateTextStub.resolves({ 'isMatch': false });
        lineReplyStub.resolves({ 'isReply': true });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(1);
        dynamoDBPutStub.resolves({'isOk': true});

        const expected = {
            'status': 'invalid text.',
            'isReply': true,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.calledOnce, true);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.called, false);
            assert.equal(getSpreadSheetPhraseStub.called, false);
            assert.equal(dynamoDBPutStub.called, false);
            assert.deepEqual(result, expected);
        });
    });

    it('キーワード検証失敗・返信失敗の場合に検証失敗・返信失敗ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': true });
        lineValidateTextStub.resolves({ 'isMatch': false });
        lineReplyStub.resolves({ 'isReply': false });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(1);
        dynamoDBPutStub.resolves({'isOk': true});

        const expected = {
            'status': 'invalid text.',
            'isReply': false,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.calledOnce, true);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.called, false);
            assert.equal(getSpreadSheetPhraseStub.called, false);
            assert.equal(dynamoDBPutStub.called, false);
            assert.deepEqual(result, expected);
        });
    });

    it('line認証失敗・返信成功の場合に認証失敗・返信成功ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': false });
        lineValidateTextStub.resolves({ 'isMatch': true });
        lineReplyStub.resolves({ 'isReply': true });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(1);
        dynamoDBPutStub.resolves({'isOk': true});

        const expected = {
            'status': 'line authorize failed.',
            'isReply': true,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.called, false);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.called, false);
            assert.equal(getSpreadSheetPhraseStub.called, false);
            assert.equal(dynamoDBPutStub.called, false);
            assert.deepEqual(result, expected);
        });
    });

    it('line認証失敗・返信失敗の場合に認証失敗・返信失敗ステータスが返る', async () => {
        lineAuthorizeStub.resolves({ 'isAuthorize': false });
        lineValidateTextStub.resolves({ 'isMatch': true });
        lineReplyStub.resolves({ 'isReply': false });
        getSpreadSheetPhraseStub.resolves({
            'isOk': true,
            'content': [
                'テストデータ',
                'test data'
            ]
        });
        dynamoDBScanStub.resolves(1);
        dynamoDBPutStub.resolves({'isOk': true});

        const expected = {
            'status': 'line authorize failed.',
            'isReply': false,
         };
        return expect(proxyIndex.handler(dummyEvent)).to.be.fulfilled.then(result => {
            assert.equal(lineAuthorizeStub.calledOnce, true);
            assert.equal(lineValidateTextStub.called, false);
            assert.equal(lineReplyStub.calledOnce, true);
            assert.equal(dynamoDBScanStub.called, false);
            assert.equal(getSpreadSheetPhraseStub.called, false);
            assert.equal(dynamoDBPutStub.called, false);
            assert.deepEqual(result, expected);
        });
    });
});

describe('Test for dynamoDbModule', () => {
    let proxyDynamoDBModule;
    let dynamoDBScanStub;
    let dynamoDBPutStub;

    const proxyDynamoDB = class {
        scan(params) {
            return {
                promise: () => {}
            }
        }
        put(params) {
            return {
                promise: () => {}
            }
        }
    };
    
    beforeEach(function() {
        proxyDynamoDBModule = proxyquire('../../../src/handlers/dynamoDbModule', {
            'aws-sdk': {
                DynamoDB: {
                    DocumentClient: proxyDynamoDB
                }
            }
        });

        dynamoDBScanStub = sinon.stub(proxyDynamoDB.prototype, 'scan');
        dynamoDBPutStub = sinon.stub(proxyDynamoDB.prototype, 'put');
    });
    afterEach(function() {
        dynamoDBScanStub.restore();
        dynamoDBPutStub.restore();
    });

    it('読み込みに成功した場合総レコード数が返る', async () => { 
        const record_count = 5;
        const scanResult = { 
            'Count': record_count,
            'ScannedCount': record_count
        };
        dynamoDBScanStub.returns({promise: () => {
            return Promise.resolve(scanResult);
        }});

        const expected = record_count;

        return expect(proxyDynamoDBModule.scanDynamo()).to.be.fulfilled.then(result => {
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.deepEqual(result, expected);
        });
    });
    
    it('読み込みに失敗した場合「-1」が返る', async () => { 
        const record_count = 5;
        const scanResult = { 
            'Count': record_count,
            'ScannedCount': record_count
        };
        dynamoDBScanStub.returns({promise: () => {
            return Promise.reject('error')
        }});

        const expected = -1;

        return expect(proxyDynamoDBModule.scanDynamo()).to.be.fulfilled.then(result => {
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.deepEqual(result, expected);
        });
    });
    
    it('書き込みに成功した場合は、成功ステータスが返る', async () => { 
        dynamoDBPutStub.returns({promise: () => {
            return Promise.resolve();
        }});

        const expected = {'isOk': true};

        return expect(proxyDynamoDBModule.putDynamo()).to.be.fulfilled.then(result => {
            assert.equal(dynamoDBPutStub.calledOnce, true);
            assert.deepEqual(result, expected);
        });
    });

    it('書き込みに失敗した場合は、失敗ステータスが返る', async () => { 
        dynamoDBPutStub.returns({promise: () => {
            return Promise.reject('error')
        }});

        const expected = {'isOk': false};
        
        return expect(proxyDynamoDBModule.putDynamo()).to.be.fulfilled.then(result => {
            assert.equal(dynamoDBPutStub.calledOnce, true);
            assert.deepEqual(result, expected);
        });
    });
});

describe('Test for lineModule', () => {
    let sandbox;
    let proxyLineModule;
    let cryptoStub;
    let lineClientStub;

    const dummyEvent = {
        "headers": {
            "target-header": "dummySignature"
        },
        "body": '{"events": [{"replyToken": "dummyToken", "message": {"text": "dummyText"}}]}'
    };
    const errEvent = {
        "headers": {
            "target-header": "errSignature"
        },
        "body": '{"events": [{"replyToken": "errToken", "message": {"text": "errText"}}]}'
    };
    // process.env.LINE_HEADER = 'target-header'
    // process.env.LINE_TRIGGER_WORD = 'dummyText'
    // process.env.LINE_CHANNEL_SECRET = 'dummyToken'
    beforeEach(() => {
        sandbox = createSandbox();
        sandbox.stub(process, 'env').value({
            LINE_HEADER: 'target-header',
            LINE_TRIGGER_WORD: 'dummyText',
            LINE_CHANNEL_SECRET: 'dummyToken',
        });

        cryptoStub = {};
        cryptoStub.createHmac = sandbox.stub().returns(cryptoStub);
        cryptoStub.update = sandbox.stub().returns(cryptoStub);
        cryptoStub.digest = sandbox.stub().returns(cryptoStub);

        lineClientStub = {};
        lineClientStub.Client = sandbox.stub().returns(lineClientStub);
        lineClientStub.replyMessage = sandbox.stub().returns(lineClientStub);

        proxyLineModule = proxyquire('../../../src/handlers/lineModule', {
            'crypto': cryptoStub,
            '@line/bot-sdk': lineClientStub
        });
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('認証成功した場合、認証成功ステータスが返る', () => {
        cryptoStub.digest.returns('dummySignature');
        
        const expected = { 'isAuthorize': true };
        return expect(proxyLineModule.authorize(dummyEvent)).to.be.fulfilled.then(result => {
            sinon.assert.calledOnce(cryptoStub.createHmac);
            sinon.assert.calledWith(cryptoStub.createHmac, 'sha256', );
            sinon.assert.calledOnce(cryptoStub.update);
            sinon.assert.calledOnce(cryptoStub.digest);
            sinon.assert.calledWith(cryptoStub.digest, 'base64');
            sinon.assert.callOrder(cryptoStub.createHmac, cryptoStub.update, cryptoStub.digest);
            assert.deepEqual(result, expected);
        });
    });

    it('認証失敗した場合（cryptoエラー）、認証失敗ステータスが返る', () => {
        cryptoStub.digest.throws('error');
        
        const expected = { 'isAuthorize': false };
        return expect(proxyLineModule.authorize(dummyEvent)).to.be.fulfilled.then(result => {
            sinon.assert.calledOnce(cryptoStub.createHmac);
            sinon.assert.calledWith(cryptoStub.createHmac, 'sha256', );
            sinon.assert.calledOnce(cryptoStub.update);
            sinon.assert.calledOnce(cryptoStub.digest);
            sinon.assert.calledWith(cryptoStub.digest, 'base64');
            sinon.assert.callOrder(cryptoStub.createHmac, cryptoStub.update, cryptoStub.digest);
            assert.deepEqual(result, expected);
        });
    });

    it('認証失敗した場合（署名不一致）、認証失敗ステータスが返る', () => {
        cryptoStub.digest.returns('differentSignature');
        
        const expected = { 'isAuthorize': false };
        return expect(proxyLineModule.authorize(dummyEvent)).to.be.fulfilled.then(result => {
            sinon.assert.calledOnce(cryptoStub.createHmac);
            sinon.assert.calledWith(cryptoStub.createHmac, 'sha256', );
            sinon.assert.calledOnce(cryptoStub.update);
            sinon.assert.calledOnce(cryptoStub.digest);
            sinon.assert.calledWith(cryptoStub.digest, 'base64');
            sinon.assert.callOrder(cryptoStub.createHmac, cryptoStub.update, cryptoStub.digest);
            assert.deepEqual(result, expected);
        });
    });

    it('与えられたテキストがキーと一致した場合、検証成功ステータスが返る', () => {
        const expected = { 'isMatch': true };
        return expect(proxyLineModule.validateText(dummyEvent)).to.be.fulfilled.then(result => {
            assert.deepEqual(result, expected);
        });
    });

    it('与えられたテキストがキーと一致しない場合、検証失敗ステータスが返る', () => {
        const expected = { 'isMatch': false };
        return expect(proxyLineModule.validateText(errEvent)).to.be.fulfilled.then(result => {
            assert.deepEqual(result, expected);
        });
    });

    it('返信成功した場合、送信成功ステータスが返る', () => {
        lineClientStub.replyMessage.resolves();

        const expected = { 'isReply': true };
        return expect(proxyLineModule.reply(dummyEvent, 'replyMessage')).to.be.fulfilled.then(result => {
            sinon.assert.calledOnce(lineClientStub.Client);
            sinon.assert.calledOnce(lineClientStub.replyMessage);
            sinon.assert.callOrder(lineClientStub.Client, lineClientStub.replyMessage);
            assert.deepEqual(result, expected);
        });
    });

    it('返信失敗した場合、送信失敗ステータスが返る', () => {
        lineClientStub.replyMessage.rejects();

        const expected = { 'isReply': false };
        return expect(proxyLineModule.reply(dummyEvent, 'replyMessage')).to.be.fulfilled.then(result => {
            sinon.assert.calledOnce(lineClientStub.Client);
            sinon.assert.calledOnce(lineClientStub.replyMessage);
            sinon.assert.callOrder(lineClientStub.Client, lineClientStub.replyMessage);
            assert.deepEqual(result, expected);
        });
    });
});