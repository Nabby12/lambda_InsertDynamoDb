'use strict'

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = chai.assert;
const expect = chai.expect;

const { createSandbox } = require('sinon');
const {google} = require('googleapis');

describe('Test for googleSheetsModule', () => {
    let sandbox;
    let oAuth2ClientStub;
    let setCredentialsStub;
    let sheetsStub;
    let getStub;
    
    sandbox = sinon.createSandbox();
    sandbox.stub(process, 'env').value({
        SPREADSHEET_JAN_PHRASE_COLUMN: '1',
        SPREADSHEET_ENG_PHRASE_COLUMN: '2',
    });

    const googleSheetsModule = require('../../../src/handlers/googleSheetsModule');
    beforeEach(() => {
        setCredentialsStub = sandbox.stub();
        oAuth2ClientStub = sandbox.stub(google.auth, 'OAuth2').returns({
            setCredentials: setCredentialsStub
        });

        getStub = sandbox.stub();
        sheetsStub = sandbox.stub(google, 'sheets').returns({
            spreadsheets: {
                values: {
                    get: getStub
                }
            }
        });;
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('セルの値取得に成功した場合、取得した値が返る', async () => {
        const getValues = [
            'value1',
            'value2',
        ];
        const dummyGetResponse = {
            data: {
                values: [getValues]
            }
        }
        getStub.returns(dummyGetResponse);

        const expected = { isOk: true, content: getValues };
        return expect(googleSheetsModule.getSpreadSheetPhrase()).to.be.fulfilled.then(result => {
            console.log(result);
            sinon.assert.calledOnce(oAuth2ClientStub);
            sinon.assert.calledOnce(setCredentialsStub);
            sinon.assert.calledOnce(sheetsStub);
            sinon.assert.calledOnce(getStub);
            assert.deepEqual(result, expected);
        });
    });

    it('セルの値取得に失敗した場合、APIエラーステータスが返る', async () => {
        getStub.throws(new Error('error'));

        const errorMessage = 'The API returned an error.';
        const expected = { isOk: false, content: errorMessage };
        return expect(googleSheetsModule.getSpreadSheetPhrase()).to.be.fulfilled.then(result => {
            sinon.assert.calledOnce(oAuth2ClientStub);
            sinon.assert.calledOnce(setCredentialsStub);
            sinon.assert.calledOnce(sheetsStub);
            sinon.assert.calledOnce(getStub);
            assert.deepEqual(result, expected);
        });
    });

    it('認証に失敗した場合、認証失敗ステータスが返る', async () => {
        setCredentialsStub.throws(new Error('error'));

        const errorMessage = 'oAuth failed.';
        const expected = { isOk: false, content: errorMessage };
        return expect(googleSheetsModule.getSpreadSheetPhrase()).to.be.fulfilled.then(result => {
            sinon.assert.calledOnce(oAuth2ClientStub);
            sinon.assert.calledOnce(setCredentialsStub);
            sinon.assert.notCalled(sheetsStub);
            sinon.assert.notCalled(getStub);
            assert.deepEqual(result, expected);
        });
    });
});