const app = require("./app.js");
const conf = require("./function.json");
process.env.AIPO_USERID = conf.environment.AIPO_USERID;
process.env.AIPO_PASSWD = conf.environment.AIPO_PASSWD;
process.env.TARGET_AIPO_URL = conf.environment.TARGET_AIPO_URL;
process.env.TARGET_USERNAME = conf.environment.TARGET_USERNAME;
app.handler({},{},() => {
    process.exit();
});
