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