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
    const target_username = decodeURIComponent(event.pathParameters.targetUsername);

    console.log(event);
    console.log(context);
    console.log(target_aipo_url);
    console.log(target_username);

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
                .$$(`//div[@id='timelineOuter']//div[@class='messageContents' and .//a[contains(text(),'${target_username}')]]//a[text()='いいね！']`)
                .then((elems) => {
                  const ps = elems.map((elem) => {
                    return client
                      .elementIdClick(elem.ELEMENT);
                  });
                  return Promise.all(ps);
                })
                .$$(`//div[@id='timelineOuter']//div[@class='messageContents' and .//a[contains(text(),'${target_username}')]]`)
                .then((elems) => {
                  const ps = elems.map((elem) => {
                    return client
                      .elementIdText(elem.ELEMENT)
                      .then((res) => {
                        console.log(res.value);
                      });
                  });
                  return Promise.all(ps);
                })
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
            console.error(`failed:${err}`);
            context.fail({
                statusCode: 500,
                body: JSON.stringify({ "message": `failed:${err}` })
            });
        });
};
