const {expect} = require('chai');
const knex = require('knex');
const app = require('../src/app')
const { makeBookmarksArray } = require('../src/bookmarks-fixtures')
let db

describe('Bookmarks Endpoints', () =>{
before('make knex instance', ()=>{
    db=knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
})

after('disconnect from db', ()=>db.destroy())

before('clean the table', ()=> db('bookmarks').truncate())

afterEach('cleanup', () => db('bookmarks').truncate())

describe('GET /bookmarks', ()=>{
    context('Given no bookmarks', ()=>{
        it(`responds with 200 and an empty array`, ()=>{
            return(supertest(app)
            .get('/bookmark')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, []))
        })
    })

    context('Given there are bookmarks in the database', ()=>{
        const testBookmarks = makeBookmarksArray();
        
        beforeEach('insert bookmarks', () => {
            return db
            .into('bookmarks')
            .insert(testBookmarks)
        })

        it(`responds with 200 and all of the bookmarks`, ()=>{
            return supertest(app)
            .get('/bookmark')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, testBookmarks)
        })

        
    })
})

describe.only(`GET /bookmark/:id`, ()=>{
    context('Given no bookmarks',()=>{
        it(`responds with 404`, ()=>{
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

        it(`responds with 200 and the specified bookmark`, ()=>{
            const validId = 1
            const expectedBookmark = testBookmarks[validId-1]
            return supertest(app)
            .get(`/bookmark/${validId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, expectedBookmark)
            
        })
    })
})
})