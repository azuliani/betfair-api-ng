var Session = require('./session');
var BettingApi = require('./betting');
var AccountApi = require('./accounts');
var HeartbeatApi = require('./heartbeat');
var statusApi = require('./status');
var requestBetFair = require('./request');

var _ = require("lodash");

module.exports = {
    login: login,
    loginWithExistingToken: loginWithExistingToken
};

function login(options, cb) {
    options = options || {};
    if (!options.username && !options.password) {
        return cb(new Error('username and password has been defined!'));
    }
    if (!options.applicationKey) {
        return cb(new Error('applicationKey should been defined!'));
    }

    Session(options, function (err, session) {
        if (err) {
            return cb(err);
        }
        cb(null, Betfair(session));
    });
}

function loginWithExistingToken(options, token, cb) {
    options = options || {};
    if (!options.username && !options.password) {
        return cb(new Error('username and password has been defined!'));
    }
    if (!options.applicationKey) {
        return cb(new Error('applicationKey should been defined!'));
    }

    let session = _.extend({}, options, {token});

    cb(null, Betfair(session));
}

function Betfair(session) {
    return {
        session: session,
        betting: BettingApi(session),
        account: AccountApi(session),
        heartbeat: HeartbeatApi(session),
        status: statusApi(session),
        keepalive: function (cb) {
            requestBetFair.keepalive(session, cb);
        }
    };
}