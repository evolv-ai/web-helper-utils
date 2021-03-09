/**
 * Copyright (c) 2020
 *
 * Methods for use in Evolv experiments
 *
 * @summary Methods for use in Evolv experiments
 * @author Teo Lisitza <teo.lisitza@evolv.ai>
 *
 * Created at     : 2020-12-01
 */

function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function docComplete(fn) {
    // see if DOM is already available
    if (document.readyState === "complete") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener('readystatechange', function (event) {
            if (event.target.readyState === 'complete') {
                fn();
            }
        });
    }
}

function emitSelectorTimeout(messageObj) {
    if (messageObj && messageObj.message) {
        console.warn(messageObj.message);
    }
    window.evolv.client.emit('selector-timeout');
}

function waitForExist(selectors, callback, timeout, clearIntervalOnTimeout, resolveCb, rejectCb) {
    // EXAMPLE USAGE from within an Evolv variant:
    //
    // waitForExist(['#header11'],
    //              function() { console.log('render'); },
    //              6000,
    //              false,
    //              resolve,
    //              reject);
    //
    // return true;

    var existInterval = setInterval(function () {
        if (selectors.every(function (ss) {
            selectors.splice(selectors.indexOf(ss), 1);
            return document.querySelector(ss);
        })) {

            // Always clear interval once all selectors are found
            clearInterval(existInterval);

            try {
                callback();
            } catch (err) {
                window.evolv.client.contaminate({ details: err.message, reason: 'error-thrown' });
                throw err;
            }

            // Only set interval to null and resolve if callback() runs without error
            existInterval = null;
            resolveCb();
        }
    }, 100);

    function checkExist() {
        setTimeout(function () {
            if (existInterval) {
                if (clearIntervalOnTimeout) {
                    clearInterval(existInterval);
                }
                console.info(selectors);
                rejectCb({ message: "Selectors not found or other error thrown: " + selectors.toString() });
            }
        }, timeout);
    };

    // wait until document is complete before starting timer to check
    // for selector existence.
    docComplete(checkExist);
};

module.exports = {
    waitForExist: waitForExist,
    emitSelectorTimeout: emitSelectorTimeout,
    docComplete: docComplete,
    docReady: docReady
};
