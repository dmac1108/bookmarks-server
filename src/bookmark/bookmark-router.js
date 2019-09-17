const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const {bookmarks} = require('../store')
const bookmarkRouter = express.Router();
const bodyParser = express.json();



bookmarkRouter
.route('/bookmark')
.get((req, res)=>{
    res.json(bookmarks);
})
.post(bodyParser, (req,res) =>{
    const {title, url, rating, desc} = req.body;

    if(!title){
        logger.error(`Title not provided`);
        return res
          .status(404)
          .send('A title is required');
    }
   
    if(!url || !(/^http/.test(url))){
        logger.error(`Url not provided`);
        return res
          .status(404)
          .send('A url starting with http is required');
    }
    if(!rating || parseInt(rating) <1 || parseInt(rating)>5){
        logger.error(`Rating between 1 and 5 not provided`);
        return res
          .status(404)
          .send('A rating between 1 and 5 is required');
    }
    
    const id = uuid();
    logger.info(id);

    const bookmark = {
        id,
        title,
        url,
        rating,
        desc
    };

    bookmarks.push(bookmark);
    res
    .status(201)
    .location(`http://localhost:8000/bookmark/${id}`)
    .json({id});
})

bookmarkRouter
.route('/bookmark/:id')
.get((req,res)=>{
    const {id} = req.params;
    const bookmark = bookmarks.find(mark => mark.id == id);

    if (!bookmark) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
          .status(404)
          .send('Bookmark Not Found');
      }

    res.json(bookmark);
})
.delete((req,res)=>{
    const {id} = req.params;
    const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id == id);
    
    if(bookmarkIndex === -1){
        logger.error(`Bookmark with id ${id} not found`);
        return res
        .status(404)
        .send('Not found');
    }

    bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${id} deleted`);
    res
    .status(204)
    .end();
})

module.exports = bookmarkRouter