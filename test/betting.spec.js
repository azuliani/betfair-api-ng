var { describe, it, beforeEach, afterEach } = require('node:test');
var assert = require('node:assert');
var { MockAgent } = require('undici');
var request = require('../lib/request');
var Betting = require('../lib/betting');

describe('Spec on betting api', function () {
    var betting;
    var mockAgent;
    var sessionCfg = {
        applicationKey: 'Lv3oIsDhPgiSUHVL',
        token: 'test_token'
    };

    beforeEach(function () {
        mockAgent = new MockAgent();
        mockAgent.disableNetConnect();
        request._setDispatcher(mockAgent);
        betting = Betting(sessionCfg);
    });

    afterEach(async function () {
        await mockAgent.close();
    });

    it('listCompetitions', async function () {
        var mockPool = mockAgent.get('https://api.betfair.com');
        mockPool.intercept({
            path: '/exchange/betting/rest/v1.0/listCompetitions/',
            method: 'POST'
        }).reply(200, [{ eventId: 1 }], {
            headers: { 'content-type': 'application/json' }
        });

        var res = await new Promise(function (resolve, reject) {
            betting.listCompetitions({}, function (err, res) {
                if (err) return reject(err);
                resolve(res);
            }, 'ru');
        });

        assert.deepStrictEqual(res, [{ eventId: 1 }]);
    });

    it('listCountries', async function () {
        var mockPool = mockAgent.get('https://api.betfair.com');
        mockPool.intercept({
            path: '/exchange/betting/rest/v1.0/listCountries/',
            method: 'POST'
        }).reply(200, [{ cntId: 1 }], {
            headers: { 'content-type': 'application/json' }
        });

        var res = await new Promise(function (resolve, reject) {
            betting.listCountries({ eventId: 1 }, function (err, res) {
                if (err) return reject(err);
                resolve(res);
            }, 'ru');
        });

        assert.deepStrictEqual(res, [{ cntId: 1 }]);
    });

    it('listCurrentOrders', async function () {
        var mockPool = mockAgent.get('https://api.betfair.com');
        mockPool.intercept({
            path: '/exchange/betting/rest/v1.0/listCurrentOrders/',
            method: 'POST'
        }).reply(200, { currentOrders: [], moreAvailable: false }, {
            headers: { 'content-type': 'application/json' }
        });

        var res = await new Promise(function (resolve, reject) {
            betting.listCurrentOrders(null, function (err, res) {
                if (err) return reject(err);
                resolve(res);
            });
        });

        assert.deepStrictEqual(res, { currentOrders: [], moreAvailable: false });
    });

    it('listMarketBook check marketIds', function () {
        betting.listMarketBook(null, function (err) {
            assert.strictEqual(err, 'marketIds has been array with id"s');
        });
    });

    describe('place new order', function () {
        it('should check market id defined', function () {
            betting.placeOrders(null, null, null, null, null, null, function (err) {
                assert.strictEqual(err, 'marketId has been defined');
            });
        });

        it('should check instructions for bets', function () {
            betting.placeOrders('1.23234234', null, null, null, null, null, function (err) {
                assert.strictEqual(err, 'instructions for bets should be defined!');
            });
        });
    });
});
