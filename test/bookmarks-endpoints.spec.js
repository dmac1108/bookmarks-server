const {expect} = require('chai');
const knex = require('knex');
const app = require('../src/app')
const { makeBookmarksArray } = require('../src/bookmarks-fixtures')


describe('Bookmarks Endpoints', () => {
    let db
before('make knex instance', ()=> {
    db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
})

after('disconnect from db', () => db.destroy())

before('clean the table', () => db('bookmarks').truncate())

afterEach('cleanup', () => db('bookmarks').truncate())

describe('GET /bookmarks', ()=> {
    context('Given no bookmarks', () => {
        it(`responds with 200 and an empty array`, () => {
            return supertest(app)
            .get('/bookmark')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, [])
        })
    })

    context('Given there are bookmarks in the database', ()=>{
        const testBookmarks = makeBookmarksArray();
        
        beforeEach('insert bookmarks', () => {
            return db
            .into('bookmarks')
            .insert(testBookmarks)
        })

        it(`responds with 200 and all of the bookmarks`, () => {
            return supertest(app)
            .get('/bookmark')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, testBookmarks)
        })

        
    })
})

describe(`GET /bookmark/:id`, () => {
    context('Given no bookmarks',() => {
        it(`responds with 404`, () => {
            const bookmarkId = 123432
            return supertest(app)
            .get(`/bookmark/${bookmarkId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(404, {error: {message: 'Bookmark Not Found' } })
        })
    })

    context('Given there are bookmarks in the database', ()=>{
        const testBookmarks = makeBookmarksArray();
        
        beforeEach('insert bookmarks', () => {
            return db
            .into('bookmarks')
            .insert(testBookmarks)
        })

        it(`responds with 200 and the specified bookmark`, () => {
            const validId = 1
            const expectedBookmark = testBookmarks[validId-1]
            return supertest(app)
            .get(`/bookmark/${validId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, expectedBookmark)
            
        })
    })
})

describe(`POST '/bookmark'`, () => {
    it(`responds with 404 and error message if missing title`, ()=>{
        const newBookmark = {
            url: 'https://newbookmark.com',
            description: 'This is a new test bookmark',
            rating: 3,
        }
        return supertest(app)
        .post(`/bookmark`)
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404, {error: {message: 'A title is required' } })
    })

    it(`responds with 404 and error url is not properly formed`, ()=>{
        const newBookmark = {
            title: 'New test bookmark',
            url: 'newbookmark.com',
            description: 'This is a new test bookmark',
            rating: 3,
        }
        return supertest(app)
        .post(`/bookmark`)
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404, {error: {message: 'A valid url is required' } })
    })

    it(`responds with 404 and rating is not between 1 and 5`, ()=>{
        const newBookmark = {
            title: 'New test bookmark',
            url: 'https://newbookmark.com',
            description: 'This is a new test bookmark',
            rating: 10,
        }
        return supertest(app)
        .post(`/bookmark`)
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404, {error: {message: 'A rating between 1 and 5 is required' } })
    })


    it(`creates new bookmark and responds with 201`, ()=>{
        const newBookmark = {
            title: 'New test bookmark',
            url: 'https://newbookmark.com',
            description: 'This is a new test bookmark',
            rating: 3,
        }
        return supertest(app)
        .post(`/bookmark`)
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
            expect(res.body.title).to.eql(newBookmark.title)
            expect(res.body.url).to.eql(newBookmark.url)
            expect(res.body.description).to.eql(newBookmark.description)
            expect(res.body.rating).to.eql(newBookmark.rating)
        })
        .then(postRes => 
            supertest(app)
            .get(`/bookmark/${postRes.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(postRes.body)
        )
    })

    it(`removes xss attack content from the response `, ()=> {
        const maliciousBookmark = {
            id: 911,
            title: 'Naughty naughty very naughty <script>alert("xss");</script>',
            url: 'https://www.hackers.com',
            description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
            rating: 1,
          }
          const expectedBookmark = {
            ...maliciousBookmark,
            title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
            description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
          }

          return supertest(app)
          .post(`/bookmark`)
          .send(maliciousBookmark)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.description).to.eql(expectedBookmark.description) 
            expect(res.body.title).to.eql(expectedBookmark.title)})
    })
     
})

describe(`DELETE bookmark`, () => {
   context(`given there are no bookmarks in the database`, () => {
    it(`responds with 404`, () => {
        const bookmarkId = 123432
        return supertest(app)
        .delete(`/bookmark/${bookmarkId}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404, {error: {message: 'Bookmark Not Found' } })
    })
   })


    context('Given there are bookmarks in the database', ()=>{
        const testBookmarks = makeBookmarksArray();
        
        beforeEach('insert bookmarks', () => {
            return db
            .into('bookmarks')
            .insert(testBookmarks)
        })

        it(`deletes a bookmark and returns 204 `, () => {
            const bookmarkIdToDelete = 2
            const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== bookmarkIdToDelete);
    
            return supertest(app)
            .delete(`/bookmark/${bookmarkIdToDelete}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(204)
            .then(() => 
                supertest(app)
                .get(`/bookmark`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(expectedBookmarks)
            )
        })

        

    })

})

})