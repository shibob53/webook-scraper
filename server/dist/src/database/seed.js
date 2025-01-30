"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _AccountsSeeder = require("./seeders/AccountsSeeder.js");
const seeders = [
    new _AccountsSeeder.AccountsSeeder()
];
seeders.forEach(async (seeder)=>{
    try {
        await seeder.seed();
    } catch (error) {
        console.error(`Error seeding ${seeder.constructor.name}: ${error}`);
    }
});
