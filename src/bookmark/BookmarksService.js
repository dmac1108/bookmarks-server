const BookmarksService = {

    getAllBookmarks(knex){
        return knex
        .select('*')
        .from('bookmarks')
    },
    
    getBookmarksById(knex, id){
        return knex
        .from('bookmarks')
        .select('*')
        .where('id', id)
        .first()
    },

    insertNewBookmark(knex, newBookmark){
        console.log(knex)
        return knex
        .insert(newBookmark)
        .into('bookmarks')
        .returning('*')
        .then(rows => {return rows[0]})
    },

    updateBookmark(knex, id, newBookmarkFields){
        return knex('bookmarks')
        .where({id})
        .update(newBookmarkFields)
    },

    deleteBookmark(knex, id){
        return knex('bookmarks')
        .where({id})
        .delete()
    }

}

module.exports = BookmarksService