'use strict'

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = chai.assert;
const expect = chai.expect;
const proxyquire = require('proxyquire');

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