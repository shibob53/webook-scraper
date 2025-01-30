"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppDataSource", {
    enumerable: true,
    get: function() {
        return AppDataSource;
    }
});
require("reflect-metadata");
const _typeorm = require("typeorm");
const _User = require("./entity/User.js");
const AppDataSource = new _typeorm.DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '',
    database: 'webook_scraper',
    synchronize: true,
    logging: false,
    entities: [
        _User.User
    ],
    migrations: [],
    subscribers: []
});
