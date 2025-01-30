"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WebookScraper", {
    enumerable: true,
    get: function() {
        return WebookScraper;
    }
});
const _AccountManager = /*#__PURE__*/ _interop_require_default(require("./AccountManager.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
let WebookScraper = class WebookScraper {
    accountManager = new _AccountManager.default();
    constructor(){
        console.log('WebookScraper');
    }
};
