/**
 * Copyright (c) 2020
 *
 * Methods for use in Evolv experiments
 *
 * @summary Methods for use in Evolv experiments
 * @author Teo Lisitza <teo.lisitza@evolv.ai>
 *
 * Created at: 2020-12-01
 */

/**
 * Run callback when document is ready and interactive
 * @param {(void) => any} callback - function to run when document is ready.
 */
function docReady(callback) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(callback, 1);
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

/**
 * Run code when document is ready and complete
 * @param {(void) => any} callback - function to run when document has completed loading.
 */
function docComplete(callback) {
    // see if DOM is already available
    if (document.readyState === "complete") {
        // call on next available tick
        setTimeout(callback, 1);
    } else {
        document.addEventListener('readystatechange', function (event) {
            if (event.target.readyState === 'complete') {
                callback();
            }
        });
    }
}

/**
 * Emits an Evolv 'selector-timeout' event.
 * @param {Object} messageObj - object containing 'message' to print in console warning.
 */
function emitSelectorTimeout(messageObj) {
    if (messageObj && messageObj.message) {
        console.warn(messageObj.message);
    }
    window.evolv.client.emit('selector-timeout');
}

/**
 * Wait for one or more selectors to be present on the page before running a callback.
 * @param {Array<string | Array<string> | (void) => boolean>} selectors - Array of selector(s), function(s) and/or arrays of selectors.
 * @param {function} callback - function containing code to run when all selectors are found.
 * @param {number} timeout - how many miliseconds spend looking for selectors before giving up.
 * @param {boolean} clearIntervalOnTimeout - if true, clear the polling interval when timeout is reached.
 * @param {Function} resolveCb - variant's resolve() method
 * @param {Function} rejectCb - variant's reject() method
 * @param {string} variant - string identifying the variant currently running. Ex: 'v1-2-1'
 */
function waitForExist(selectors, callback, timeout, clearIntervalOnTimeout, resolveCb, rejectCb, variant) {
    // EXAMPLE USAGE from within an Evolv variant:
    //
    // waitForExist(['#header11', '#footer11', () => ({ true }) ['#sidebarDark', '#sidebarLight']],
    //              function() { console.log('render'); },
    //              6000,
    //              false,
    //              resolve,
    //              reject);
    //
    // return true;

    // used to store selectors as they are found
    var found = [];

    // flatten nested selectors
    selectors = selectors.map(function (selector) {
        return Array.isArray(selector) ? selector.join(',') : selector;
    });

    var existInterval = setInterval(function () {
        // check each selector; if found - move to found[] until selectors[] is empty
        selectors.forEach(function (selector) {
            var check = typeof selector === "function" ? selector() : document.querySelector(selector);
            if (check) {
                if (found.find(function (sel) { return sel === selector; })) {
                    found.push(selector);
                }
                selectors = selectors.filter(function (sel) {
                    return sel !== selector;
                });
            }
        });

        // all selectors have been found
        if (selectors.length === 0) {
            // always clear interval once all selectors are found
            clearInterval(existInterval);

            try {
                callback();
            } catch (err) {
                window.evolv.client.contaminate({
                    details: err.message,
                    reason: "Variant #" + variant + " wasn't applied"
                });

                throw err;
            }

            // only set interval to null if callback() runs without error
            existInterval = null;
        }
    }, 100);

    function checkExist() {
        setTimeout(function () {
            if (existInterval) {
                if (clearIntervalOnTimeout) {
                    clearInterval(existInterval);
                }
                // if we timeout before finding all selectors, contaminate with a message containing the selectors that were not found and the variant
                rejectCb({ message: "Selectors not found or other error thrown: " + selectors.join('|') + "; Variant: " + variant });
            }
        }, timeout);
    }

    // wait until document is complete before starting timer to check
    // for selector existence.
    docComplete(checkExist);
    // resolve immediately
    resolveCb();
}

module.exports = {
    waitForExist: waitForExist,
    emitSelectorTimeout: emitSelectorTimeout,
    docComplete: docComplete,
    docReady: docReady
};
