const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    money: String,
    email: String,
    your_comic: [
        {
            id_user: String,
            id_comic: String,
            namecomic: String,
            img:String,
            date: String,
            price:String,
        }
    ],
    fullname: String,
});
const Users = mongoose.model("Users", UserSchema);
module.exports = Users