'use strict'

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = chai.assert;
const expect = chai.expect;
const proxyquire = require('proxyquire');

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
    let proxyDynamoDBModule;
    let proxyDynamoDBScanStub;
    let proxyDynamoDBPutStub;

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

        proxyDynamoDBScanStub = sinon.stub(proxyDynamoDB.prototype, 'scan');
        proxyDynamoDBPutStub = sinon.stub(proxyDynamoDB.prototype, 'put');
    });
    afterEach(function() {
        proxyDynamoDBScanStub.restore();
        proxyDynamoDBPutStub.restore();
    });

    it('読み込みに成功した場合総レコード数が返る', async () => { 
        const record_count = 5;
        const scanResult = { 
            'Count': record_count,
            'ScannedCount': record_count
        };
        proxyDynamoDBScanStub.returns({promise: () => {
            return Promise.resolve(scanResult);
        }});

        const expected = record_count;
        return expect(proxyDynamoDBModule.scanDynamo()).to.be.fulfilled.then(result => {
            assert.equal(proxyDynamoDBScanStub.calledOnce, true);
            assert.deepEqual(result, expected);
        });
    });
    
    it('読み込みに失敗した場合「-1」が返る', async () => { 
        const record_count = 5;
        const scanResult = { 
            'Count': record_count,
            'ScannedCount': record_count
        };
        proxyDynamoDBScanStub.returns({promise: () => {
            return Promise.reject('error')
        }});

        const expected = -1;
        return expect(proxyDynamoDBModule.scanDynamo()).to.be.fulfilled.then(result => {
            assert.equal(proxyDynamoDBScanStub.calledOnce, true);
            assert.deepEqual(result, expected);
        });
    });
    
    it('書き込みに成功した場合は、成功ステータスが返る', async () => { 
        proxyDynamoDBPutStub.returns({promise: () => {
            return Promise.resolve();
        }});

        const expected = {'isOk': true};
        return expect(proxyDynamoDBModule.putDynamo()).to.be.fulfilled.then(result => {
            assert.equal(proxyDynamoDBPutStub.calledOnce, true);
            assert.deepEqual(result, expected);
        });
    });

    it('書き込みに失敗した場合は、失敗ステータスが返る', async () => { 
        proxyDynamoDBPutStub.returns({promise: () => {
            return Promise.reject('error')
        }});

        const expected = {'isOk': false};
        return expect(proxyDynamoDBModule.putDynamo()).to.be.fulfilled.then(result => {
            assert.equal(proxyDynamoDBPutStub.calledOnce, true);
            assert.deepEqual(result, expected);
        });
    });
});