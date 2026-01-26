var { describe, it, beforeEach, afterEach } = require('node:test');
var assert = require('node:assert');
var { MockAgent } = require('undici');
var request = require('../lib/request');
var Session = require('../lib/session');

describe('Spec on session configuration object', function () {
    var mockAgent;

    beforeEach(function () {
        mockAgent = new MockAgent();
        mockAgent.disableNetConnect();
        request._setDispatcher(mockAgent);
    });

    afterEach(async function () {
        await mockAgent.close();
    });

    it('should get session token', async function () {
        var mockPool = mockAgent.get('https://identitysso.betfair.com');
        mockPool.intercept({
            path: '/api/login',
            method: 'POST'
        }).reply(200, { status: 'SUCCESS', token: 'sdfsdfsdf' }, {
            headers: { 'content-type': 'application/json' }
        });

        var session = await new Promise(function (resolve, reject) {
            Session({
                applicationKey: 'Lv3oIsDhPgiSUHVL',
                username: 'test',
                password: 'test'
            }, function (err, session) {
                if (err) return reject(err);
                resolve(session);
            });
        });

        assert.deepStrictEqual(session, {
            applicationKey: 'Lv3oIsDhPgiSUHVL',
            username: 'test',
            password: 'test',
            token: 'sdfsdfsdf'
        });
    });
});
