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

type selector = string | (() => boolean);

declare global {
    interface Window {
        evolv: any;
    }
}

/**
 * Run callback when document is ready and interactive
 * @param {() => any} callback - function to run when document is ready.
 */
function docReady(callback: () => void) {
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
 * @param {() => any} callback - function to run when document has completed loading.
 */
function docComplete(callback: () => void) {
    // see if DOM is already available
    if (document.readyState === "complete") {
        // call on next available tick
        setTimeout(callback, 1);
    } else {
        document.addEventListener('readystatechange', function (event) {
            if (this.readyState === 'complete') {
                callback();
            }
        });
    }
}

/**
 * Emits an Evolv 'selector-timeout' event.
 * @param {Object} messageObj - object containing 'message' to print in console warning.
 */
function emitSelectorTimeout({ message }: { message: string }) {
    if (message) {
        console.warn(message);
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
function waitForExist(
    selectors: selector[],
    callback: () => void,
    timeout: number,
    clearIntervalOnTimeout: boolean,
    resolveCb: () => void,
    rejectCb: (message: { message: string }) => void,
    variant: string = '') {

    // used to store selectors as they are found
    const found: string[] = [];

    // flatten nested selectors
    selectors = selectors.map(selector => Array.isArray(selector) ? selector.join(',') : selector);

    const existInterval = setInterval(() => {
        // check each selector; if found - move to found[] until selectors[] is empty
        selectors.forEach(selector => {
            const check = typeof selector === "function"
                ? selector()
                : document.querySelector(selector);

            if (check) {
                if (found.find(sel => sel === selector)) {
                    found.push(selector.toString());
                }
                selectors = selectors.filter(sel => sel !== selector);
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
        }
    }, 100);

    function checkExist() {
        setTimeout(() => {
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

export = () => {
    if (!window.evolv) {
        window.evolv = {};
    }
    if (!window.evolv.helpers) {
        window.evolv.helpers = {
            docReady,
            docComplete,
            emitSelectorTimeout,
            waitForExist
        };
    }
};