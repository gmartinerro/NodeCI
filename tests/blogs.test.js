const Page = require('./helpers/page');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000/');
});

afterEach(async () => {
    await page.close();
});

describe('When logged in', async () => {
    beforeEach(async () => {
        await page.login();
        await page.click('a[href="/blogs/new"]');
    });

    test('I can see blog create form', async () => {
        const text = await page.getContentsOf('form label');
        expect(text).toEqual('Blog Title');
    });

    describe('and using invalid inputs', async () => {
        beforeEach(async () => {
            await page.click('form button');
        });

        test('the form shows an error message', async () => {
            const text = await page.getContentsOf('.title .red-text');
            expect(text).toEqual('You must provide a value');

            const text2 = await page.getContentsOf('.content .red-text');
            expect(text2).toEqual('You must provide a value');
        });
    });

    describe('and using valid inputs', async () => {
        beforeEach(async () => {
            await page.type('.title input', 'Kakonas');
            await page.type('.content input', 'Lorem ipsum');
            await page.click('form button');
        });

        test('Submitting takes user to review screen', async () => {
            const text = await page.getContentsOf('form h5');
            expect(text).toEqual('Please confirm your entries');
        });

        test('Submitting then saving takes user to index screen', async () => {
            await page.click('.green.btn-flat');
            const exists = await page.waitForSelector('.btn-floating.btn-large.red');
            expect(exists).toBeTruthy();
        });
    });
});

describe('When not logged in', async () => {
    const actions = [
        {
            method: 'get',
            path: '/api/blogs',
        },
        {
            method: 'post',
            path: '/api/blogs',
            data: { title: 'T', content: 'C' },
        },
    ];

    // test('I cannot create a blog', async () => {
    //     const result = await page.post('/api/blogs', { title: 'My Title', content: 'My Content' });
    //     expect(result).toEqual({ error: 'You must log in!' });
    // });

    // test('User cannot get a list of blogs', async () => {
    //     const result = await page.get('/api/blogs');
    //     expect(result).toEqual({ error: 'You must log in!' });
    // });

    test('Blog related actions are forbidden', async () => {
        const results = await page.execRequests(actions);
        for (let result of results) {
            expect(result).toEqual({ error: 'You must log in!' });
        }
    });
});
