module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_URL: process.env.dB_URL || 'postgresql://dunder-mifflin@localhost/bookmarks'
}