"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return AccountManager;
    }
});
let AccountManager = class AccountManager {
    async getLoggedInAccounts() {
        return [];
    }
    async loginAccount(email) {}
    async getAccountTickets(email) {
        return [];
    }
    // returns a list of booked tickets for the account
    async accountBookedTickets(email) {
        return [];
    }
    async bookTicket(email, ticket) {
        return false;
    }
};
