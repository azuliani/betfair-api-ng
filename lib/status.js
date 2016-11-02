/**
 * Race status api for betfair
 */

var requestBetFair = require('./request');

module.exports = function (session) {

    /**
     * This race status API allows customers to request the current status of a race
     */
    return function (session, raceIds, cb) {
        requestBetFair.status(session, {
            raceIds: raceIds
        }, cb);
    }
};