var { describe, it, beforeEach, afterEach } = require('node:test');
var assert = require('node:assert');
var { MockAgent } = require('undici');
var request = require('../lib/request');
var Accounts = require('../lib/accounts');

describe('Spec on account api', function () {
    var account;
    var mockAgent;
    var sessionCfg = {
        applicationKey: 'Lv3oIsDhPgiSUHVL',
        token: 'test_token'
    };

    beforeEach(function () {
        mockAgent = new MockAgent();
        mockAgent.disableNetConnect();
        request._setDispatcher(mockAgent);
        account = Accounts(sessionCfg);
    });

    afterEach(async function () {
        await mockAgent.close();
    });

    it('should getAccountDetails', async function () {
        var expected = {
            "currencyCode": "USD",
            "firstName": "Iliya",
            "lastName": "Zaharov",
            "localeCode": "en",
            "region": "GBR",
            "timezone": "EET",
            "discountRate": 0.0,
            "pointsBalance": 724
        };

        var mockPool = mockAgent.get('https://api.betfair.com');
        mockPool.intercept({
            path: '/exchange/account/rest/v1.0/getAccountDetails/',
            method: 'POST'
        }).reply(200, expected, {
            headers: { 'content-type': 'application/json' }
        });

        var res = await new Promise(function (resolve, reject) {
            account.getAccountDetails(function (err, res) {
                if (err) return reject(err);
                resolve(res);
            });
        });

        assert.deepStrictEqual(res, expected);
    });
});
