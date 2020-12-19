'use strict'

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'))
const assert = chai.assert;
const expect = chai.expect;

const lambda = require('../../../src/handlers/index.js');
const googleSheetsModule = require('../../../src/handlers/googleSheetsModule');
const dynamoDbModule = require('../../../src/handlers/dynamoDbModule');

describe('Test for index', () => {
    let dynamoDBPutStub;
    let dynamoDBScanStub;
    let getSpreadSheetPhraseStub;
    
    beforeEach(function() {
        dynamoDBScanStub = sinon.stub(dynamoDbModule, 'scanDynamo');
        dynamoDBPutStub = sinon.stub(dynamoDbModule, 'putDynamo');
        getSpreadSheetPhraseStub = sinon.stub(googleSheetsModule, 'getSpreadSheetPhrase');
    });

    afterEach(function() {
        dynamoDBScanStub.restore();
        dynamoDBPutStub.restore();
        getSpreadSheetPhraseStub.restore();
    });
    
    it('DynamoDBにデータ追加できた場合に書込成功ステータスが返る', async () => { 
        getSpreadSheetPhraseStub.returns(Promise.resolve([
            'テストデータ',
            'test data'
        ]));
        dynamoDBScanStub.returns(Promise.resolve(1));       
        dynamoDBPutStub.returns(Promise.resolve({'isOk': true}));       

        return expect(lambda.handler()).to.be.fulfilled.then(result => {
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.equal(dynamoDBPutStub.called, true);
            assert.equal(getSpreadSheetPhraseStub.calledOnce, true);
            assert.deepEqual(result, { status: 'put item succeeded.' });
        });
    });

    it('DynamoDBにデータ追加できなかった場合に書込失敗ステータスが返る', async () => {        
        getSpreadSheetPhraseStub.returns(Promise.resolve([
            'テストデータ',
            'test data'
        ]));
        dynamoDBScanStub.returns(Promise.resolve(1));       
        dynamoDBPutStub.returns(Promise.resolve({'isOk': false}));       

        return expect(lambda.handler()).to.be.fulfilled.then(result => {
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.equal(dynamoDBPutStub.called, true);
            assert.equal(getSpreadSheetPhraseStub.calledOnce, true);
            assert.deepEqual(result, { status: 'put item failed.' });
        });
    });

    it('DynamoDBのレコード数が取得できない場合にDB読込失敗ステータスが返る', async () => {        
        getSpreadSheetPhraseStub.returns(Promise.resolve([
            'テストデータ',
            'test data'
        ]));
        dynamoDBScanStub.returns(Promise.resolve(-1));       
        dynamoDBPutStub.returns(Promise.resolve({'isOk': true}));       

        return expect(lambda.handler()).to.be.fulfilled.then(result => {
            assert.equal(dynamoDBScanStub.calledOnce, true);
            assert.equal(dynamoDBPutStub.called, false);
            assert.equal(getSpreadSheetPhraseStub.calledOnce, false);
            assert.deepEqual(result, { status: 'db scan failed.' });
        });
    });
});

describe('Test for dynamoDbModule', () => {
    it('レコード数 + 1が返る', async () => { 
        
    });
    
    it('読み込みに失敗した場合「-1」が返る', async () => { 
        
    });
    
    it('書き込みに成功した場合レコードが追加され、成功ステータスが返る', async () => { 
        
    });

    it('書き込みに失敗した場合レコードは変化せず、失敗ステータスが返る', async () => { 
        
    });
});