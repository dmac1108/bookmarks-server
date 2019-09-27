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
.route('/bookmark')
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
        .location(`/bookmark/${bookmark.id}`)
        .json(serializeBookmark(bookmark));
    })
    .catch(next)
    
})

bookmarkRouter
.route('/bookmark/:id')
.all((req, res, next) =>{
    BookmarksService.getBookmarksById(
        req.app.get('db'),
        req.params.id
    )
    .then(bookmark => {
        if (typeof bookmark === 'undefined') {
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
    .then(
        res
        .status(204)
        .end() 
    )
    .catch(next)
    logger.info(`Bookmark with id ${id} deleted`)
    
})

module.exports = bookmarkRouter