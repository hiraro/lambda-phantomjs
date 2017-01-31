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

exports.handler = (event, context, callback) => {
    const user_id = process.env.AIPO_USERID;	
    const passwd = process.env.AIPO_PASSWD;
    const target_aipo_url = process.env.TARGET_AIPO_URL;
    const target_username = process.env.TARGET_USERNAME;

    phantomjs
        .run('--webdriver=4444')
        .then((phantom) => {
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
                })
                .catch((err) => {
                    console.error(`error: ${err}`);
                    phantom.kill();
                });
        })
        .then(() => {
            console.log("done");
            callback();
        })
        .catch((err) => {
            console.error('failed');
            callback(err);
        });
};
