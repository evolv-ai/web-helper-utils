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
        document.addEventListener('readystatechange', function(event) {
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

// EXAMPLE USAGE from within an Evolv variant:
//
// function render() { // do stuff }
// render.variant = "2.1 example variant"
// waitForExist(['#header11'],
//              render,
//              resolve,
//              reject);
//
// return true;
function waitForExist(selectors, renderCb, resolveCb, rejectCb, timeout=60000, clearIntervalOnTimeout=true) {
    var variant = renderCb.variant;

    // flatten nested selectors
    selectors = selectors.map(function (selector) {
        return Array.isArray(selector) ? selector.join(',') : selector;
    });
    var existInterval = setInterval(function () {
        // check each selector; if found - move to found[] until selectors[] is empty
        selectors = selectors.filter(function (selector) {
            return !(typeof selector === "function" ? selector() : document.querySelector(selector));
        });
        if (selectors.length === 0) {
            // Always clear interval once all selectors are found
            clearInterval(existInterval);
            try {
                renderCb();
            } catch (err) {
                window.evolv.client.contaminate({
                    details: err.message,
                    reason: "Variant #" + variant + " wasn't applied"
                });
                throw err;
            }
            // Only set interval to null if renderCb() runs without error
            existInterval = null;
        }
    }, 100);

    function checkExist() {
        setTimeout(function () {
            if (existInterval) {
                if (clearIntervalOnTimeout) {
                    clearInterval(existInterval);
                }
                rejectCb({
                    message: "Selectors not found or other error thrown: " + selectors.join('|') + "; Variant: " + variant
                });
            }
        }, timeout);
    }
    // wait until document is complete before starting timer to check
    // for selector existence.
    docComplete(checkExist);
    resolveCb();
}

function runVariant(attr, render) {
    var htmlNode = document.children[0];

    if (!htmlNode.hasAttribute(attr)) {
        htmlNode.setAttribute(attr, true);
        render();
    }
}

module.exports = {
    runVariant: runVariant,
    waitForExist: waitForExist,
    emitSelectorTimeout: emitSelectorTimeout,
    docComplete: docComplete,
    docReady: docReady
};
