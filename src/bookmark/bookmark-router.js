
const path = require('path');
const express = require('express');
const xss = require('xss')
const uuid = require('uuid/v4');
const logger = require('../logger');
const {bookmarks} = require('../bookmarks-fixtures')
const bookmarkRouter = express.Router();
const bodyParser = express.json();
const BookmarksService = require('./BookmarksService')

const serializeBookmark = bookmark => ({
    id: bookmark.id, 
    title: xss(bookmark.title),
    url: bookmark.url, 
    rating: Number(bookmark.rating), 
    description: xss(bookmark.description)
})

bookmarkRouter
.route('/')
.get((req, res, next)=>{
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
    .then(response => {
        res.json(response.map(serializeBookmark))
    })
    .catch(next)
})
.post(bodyParser, (req,res, next) => {
    const {title, url, rating, description} = req.body;

    if(!title){
        logger.error(`Title not provided`);
        return res
          .status(404)
          .json({error: {message: 'A title is required' }})
    }
   
    if(!url || !(/^http/.test(url))){
        logger.error(`Url not provided`);
        return res
          .status(404)
          .json({error: {message: 'A valid url is required' }})
    }
    if(!rating || parseInt(rating) <1 || parseInt(rating)>5){
        logger.error(`Rating between 1 and 5 not provided`);
        return res
          .status(404)
          .json({error: {message: 'A rating between 1 and 5 is required' }})
    }
    
     const newBookmark = {
        title,
        url,
        rating,
        description
    };

    const knexInstance = req.app.get('db')
    BookmarksService.insertNewBookmark(knexInstance, newBookmark)
    .then(bookmark =>{
        res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
        .json(serializeBookmark(bookmark));
    })
    .catch(next)
    
})

bookmarkRouter
.route('/:id')
.all((req, res, next) => {
    const {id} = req.params
    BookmarksService.getBookmarksById(
        req.app.get('db'),
        id
    )
    .then(bookmark => {
        if(!bookmark) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res
              .status(404)
              .json({error: {message: 'Bookmark Not Found' }})
              
          }
          res.bookmark = bookmark
          next()
    })
    .catch(next)
})
.get((req,res)=>{
    res.json(serializeBookmark(res.bookmark))
})
.delete((req,res,next)=>{
    const {id} = req.params;
    BookmarksService.deleteBookmark(req.app.get('db'), id)
    .then(numRowsAffected => {
        logger.info(`Bookmark with id ${id} deleted`)
        res
        .status(204)
        .end() 
    })
    .catch(next)   
})
.patch(bodyParser, (req, res, next) =>{
    const {id} = req.params
    const {title, url, rating, description} = req.body
    const newBookmarkFields = {title, url, rating, description} 

    const numberofValues = Object.values(newBookmarkFields).filter(Boolean).length
    if(numberofValues === 0) {
        return res.status(400).json({
            error: { message: `Request body must contain either 'title', 'url', 'rating', or 'description'`}
        })
    }
      
    BookmarksService.updateBookmark(req.app.get('db'),id,newBookmarkFields)
    .then(numRowsAffected => {
        res.status(204).end()
    })
    .catch(next)
})
module.exports = bookmarkRouter