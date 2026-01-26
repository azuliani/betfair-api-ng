/**
 * Request maker for BetFair api.
 */
var fs = require('fs');
var { Agent, Pool } = require('undici');

var POOL_CONNECTIONS = 100;
var pools = {};

var dispatcher = new Agent({
    keepAliveTimeout: 4000,
    keepAliveMaxTimeout: 10000,
    connections: POOL_CONNECTIONS,
    factory: function (origin, opts) {
        var pool = new Pool(origin, opts);
        pools[origin] = pool;
        return pool;
    }
});

function _checkPoolCapacity(url) {
    var origin = new URL(url).origin;
    var pool = pools[origin];
    if (pool) {
        var s = pool.stats;
        if (s.queued > 0 || s.connected >= POOL_CONNECTIONS) {
            console.log(
                `[betfair-api-ng] connection pool at capacity for ${origin} — connected: ${s.connected}/${POOL_CONNECTIONS}, running: ${s.running}, queued: ${s.queued}, pending: ${s.pending}`
            );
        }
    }
}

function _doFetch(url, options, cb) {
    cb = cb || new Function;
    (async () => {
        try {
            _checkPoolCapacity(url);
            var res = await fetch(url, {
                method: options.method,
                headers: options.headers,
                body: options.body,
                dispatcher: dispatcher,
                signal: AbortSignal.timeout(30000)
            });
            var contentType = res.headers.get('content-type') || '';
            var body;
            if (contentType.includes('application/json')) {
                body = await res.json();
            } else {
                var text = await res.text();
                try { body = JSON.parse(text); } catch (_) { body = text; }
            }
            if (res.status === 200) {
                cb(null, body);
            } else {
                cb(body);
            }
        } catch (err) {
            cb(err);
        }
    })();
}

module.exports = {

    keepalive: function(session, cb){
        _doFetch('https://identitysso-cert.betfair.com/api/keepAlive', {
            method: 'GET',
            headers: {
                'X-Application': session.applicationKey,
                'X-Authentication': session.token,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            }
        }, cb);
    },

    login: function (sessionConfig, cb) {
        var options = sessionConfig;
        var url = 'https://identitysso-cert.betfair.com/api/certlogin';
        var loginDispatcher = null;

        if (!options.cert || !options.key) {
            url = 'https://identitysso.betfair.com/api/login';
        } else {
            loginDispatcher = new Agent({
                connect: {
                    cert: fs.readFileSync(options.certFile),
                    key: fs.readFileSync(options.keyFile)
                }
            });
        }

        var body = new URLSearchParams({
            username: options.username,
            password: options.password
        });

        (async () => {
            try {
                var res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-Application': options.applicationKey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body.toString(),
                    dispatcher: loginDispatcher || dispatcher,
                    signal: AbortSignal.timeout(30000)
                });
                var data = await res.json();
                if (loginDispatcher) loginDispatcher.close();
                if (data.status === 'SUCCESS') {
                    cb(null, data.token);
                } else {
                    cb(data);
                }
            } catch (err) {
                if (loginDispatcher) loginDispatcher.close();
                cb(err);
            }
        })();
    },

    /**
     * Send request on REST Api
     * @param session
     * @param params
     * @param cb
     */
    send: function (session, params, cb) {
        var action = params.action;
        var data = params.data;

        _doFetch('https://api.betfair.com/exchange/betting/rest/v1.0/' + action + '/', {
            method: 'POST',
            headers: {
                'X-Application': session.applicationKey,
                'X-Authentication': session.token,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify(data)
        }, cb);
    },

    sendAccount: function (session, params, cb) {
        var action = params.action;
        var data = params.data;

        _doFetch('https://api.betfair.com/exchange/account/rest/v1.0/' + action + '/', {
            method: 'POST',
            headers: {
                'X-Application': session.applicationKey,
                'X-Authentication': session.token,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify(data || {})
        }, cb);
    },

    heartbeat: function (session, params, cb) {
        _doFetch('https://api.betfair.com/exchange/heartbeat/json-rpc/v1', {
            method: 'POST',
            headers: {
                'X-Application': session.applicationKey,
                'X-Authentication': session.token,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                "params": params,
                "jsonrpc": "2.0",
                "method": "HeartbeatAPING/v1.0/heartbeat",
                "id": 1
            })
        }, cb);
    },

    status: function (session, params, cb) {
        _doFetch('https://api.betfair.com/exchange/scores/json-rpc/v1', {
            method: 'POST',
            headers: {
                'X-Application': session.applicationKey,
                'X-Authentication': session.token,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                "params": params,
                "jsonrpc": "2.0",
                "method": "ScoresAPING/v1.0/listRaceDetails",
                "id": 1
            })
        }, cb);
    },

    sendRPC: function (session, params, cb) {
        var optionsLog = {
            url: 'https://api.betfair.com/exchange/betting/json-rpc/v1',
            body: params,
            headers: {
                'X-Application': session.applicationKey,
                'X-Authentication': session.token,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            }
        };
        console.log(JSON.stringify(optionsLog, null, 4));
        _doFetch('https://api.betfair.com/exchange/betting/json-rpc/v1', {
            method: 'POST',
            headers: {
                'X-Application': session.applicationKey,
                'X-Authentication': session.token,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify(params)
        }, cb);
    },

    _setDispatcher: function (d) {
        dispatcher = d;
    }
};
