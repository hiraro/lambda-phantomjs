'use strict';

const phantomjs = require('phantomjs-prebuilt');
const webdriverio = require('webdriverio');
const webDriverOpts = {
    desiredCapabilities: {
        browserName: 'phantomjs',
        logLevel: 'verbose',
        host: 'localhost',
        port: '4444'
    }
};

const instanceDataList = {
    "mi-0642924909678e6e7": {
        "aipoUrl": 'http://uma-no-hone.net/'
    }
};
 
const getAipoUrlFromInstanceId = (instanceId) => {
   return (instanceId in instanceDataList) && ('aipoUrl' in instanceDataList[instanceId]) 
	? instanceDataList[instanceId]['aipoUrl'] : null;
};

exports.handler = (event, context, callback) => {
    const user_id = process.env.AIPO_USERID;	
    const passwd = process.env.AIPO_PASSWD;
    const target_aipo_url = getAipoUrlFromInstanceId(event.pathParameters.instanceId);

    console.log(event);
    console.log(context);
    console.log(target_aipo_url);

    phantomjs
        .run('--webdriver=4444')
        .then((phantom) => {
            if (!target_aipo_url) {
                phantom.kill();
                return Promise.reject("invalid aipo url given");
            }
            const client = webdriverio.remote(webDriverOpts).init();
            return client
                .url(target_aipo_url)
                .waitForExist('.button[value="ログイン"]', 10000)
                .setValue('#member_username', user_id)
                .setValue('#password', passwd)
                .click('.button[value="ログイン"]')
                .waitForExist('=Aipo', 10000)
                .click('//input[@type="button" and (@value="出勤" or @value="退勤")]')
                .pause(5000)
                .then(() => {
                    phantom.kill();
                    return Promise.resolve();
                })
                .catch((err) => {
                    console.error(`error: ${err}`);
                    phantom.kill();
                    return Promise.reject(err);  
                });
        })
        .then(() => {
            console.log("done");
            context.succeed({
                statusCode: 200,
                body: JSON.stringify({ "message": "done" })
            });
        })
        .catch((err) => {
            console.error(`failed: ${err}`);
            context.fail({
                statusCode: 500,
                body: JSON.stringify({ "message": `failed:${err}` })
            });
        });
};
