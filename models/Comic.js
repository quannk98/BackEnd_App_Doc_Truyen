const mongoose = require('mongoose')
const ComicSchema = new mongoose.Schema({
    namecomic: String,
    price: String,
    author: String,
    publishing_year: Number,
    genres: String,
    describe: String,
    comment: [
        {
            id_comic: String,
            id_user: String,
            username:String,
            content: String,
            date: String
        }
    ],
    cover_image: String,
    comic_content: String

});
const Comics = mongoose.model("Comics", ComicSchema);
module.exports = Comics