"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
require("reflect-metadata");
const _datasource = require("./data-source.js");
const _express = /*#__PURE__*/ _interop_require_default(require("express"));
const _home = /*#__PURE__*/ _interop_require_default(require("./routes/home.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
_datasource.AppDataSource.initialize().then(async ()=>{
    // console.log('Inserting a new user into the database...')
    // const user = new User()
    // user.firstName = 'Timber'
    // user.lastName = 'Saw'
    // user.age = 25
    // await AppDataSource.manager.save(user)
    // console.log('Saved a new user with id: ' + user.id)
    // console.log('Loading users from the database...')
    // const users = await AppDataSource.manager.find(User)
    // console.log('Loaded users: ', users)
    const app = (0, _express.default)();
    const PORT = 3000;
    app.use(_express.default.json());
    app.use(_home.default);
    app.listen(PORT, ()=>{
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}).catch((error)=>console.log(error));
