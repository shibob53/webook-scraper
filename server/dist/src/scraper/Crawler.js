"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Crawler", {
    enumerable: true,
    get: function() {
        return Crawler;
    }
});
const _BrowserWindowManager = /*#__PURE__*/ _interop_require_default(require("./BrowserWindowManager.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
let Crawler = class Crawler {
    browserManager;
    constructor(){
        console.log('Crawler');
    }
    async start() {
        this.browserManager = new _BrowserWindowManager.default();
        await this.browserManager.createSession();
    }
    async stop() {
        await this.browserManager.clearSession();
    }
};
