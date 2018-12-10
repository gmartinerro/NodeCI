const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class Page {
    static async build() {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        const _page = new Page(page, browser);

        return new Proxy(_page, {
            get: function(target, property) {
                return _page[property] || browser[property] || page[property];
            },
        });
    }

    constructor(page, browser) {
        this.page = page;
        this.browser = browser;
    }

    async login() {
        const user = await userFactory();
        const { session, sig } = sessionFactory(user);

        await this.page.setCookie({ name: 'session', value: session });
        await this.page.setCookie({ name: 'session.sig', value: sig });
        await this.page.goto('http://localhost:3000/blogs');
        await this.page.waitFor('a[href="/auth/logout"]');
    }

    getContentsOf(selector) {
        return this.page.$eval(selector, el => el.innerHTML);
    }

    get(path) {
        return this.page.evaluate(path => {
            return fetch(path, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.json());
        }, path);
    }

    post(path, data) {
        return this.page.evaluate(
            (path, data) => {
                return fetch(path, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                }).then(res => res.json());
            },
            path,
            data,
        );
    }

    execRequests(actions) {
        return Promise.all(
            actions.map(action => {
                return this[action.method](action.path, action.data);
            }),
        );
    }
}

module.exports = Page;
