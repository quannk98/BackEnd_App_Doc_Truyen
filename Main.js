const { render } = require('ejs')
const express = require('express')
const app = express()
app.use(express.static('public'));
const socketIo = require('socket.io');
const http = require('http');
const server = http.createServer(app); 
const io = socketIo(server);
const port = 3000
const bodyParser = require("body-parser");
app.use(bodyParser.json())
app.use(express.json());
app.set('view engine', 'ejs')
app.use('/images', express.static('images'))
app.use('/PDF', express.static('E:/Sever/AssignmentGD1_AndroidNetWorking/PDF'));

const path = require('path');
const mongoose = require('mongoose')
const Comic = require("./models/Comic")
const User = require("./models/Users")
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        if (file.fieldname === 'cover_image') {
            cb(null, 'images');
        } else if (file.fieldname === 'pdf_comic') {
            cb(null, 'PDF');
        } else {
            cb({ error: 'Invalid field name' });
        }
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }

});
const upload = multer({ storage: storage });


mongoose.connect("mongodb://127.0.0.1:27017/AndroidNetworking", {
    useNewUrlParser: true, useUnifiedTopology: true
})
    .then(() => {
        console.log('Kết nối tới MongoDB thành công.');
    })
    .catch((err) => {
        console.error('Lỗi khi kết nối tới MongoDB: ' + err);
    });

app.get("/homecomic", async (req, res) => {
    const relativePath = "Screen/HomeComic"
    res.render(relativePath)
})
app.get("/listcomic", async (req, res) => {
    try {
        const comics = await Comic.find()

        res.render("Screen/ListComic", { comics })
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})
app.get("/insertcomic", async (req, res) => {
    const relativePath = "Screen/InsertComic"
    res.render(relativePath)
})
app.get("/editcomic/:id", async (req, res) => {
    const comicId = req.params.id;
    try {
        const comic = await Comic.findById(comicId)
        const relativePath = "Screen/EditComic";
        res.render(relativePath, { comic })

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})
app.get("/edituser/:id", async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId)
        const relativePath = "Screen/EditUser";
        res.render(relativePath, { user })

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})
app.post('/insertcomic/comic', upload.fields([{ name: 'cover_image', maxCount: 1 }, { name: 'pdf_comic', maxCount: 1 }]), async (req, res) => {
    const namecheck = req.body.name
    try {
        const existing = await Comic.findOne({ namecomic: namecheck })
        if (existing) {
            return res.status(400).json({ message: "already exists" });
        }
        else {
            const coverImage = req.files['cover_image'][0].filename;
            const pdfComic = req.files['pdf_comic'][0].filename;

            if (!coverImage || !pdfComic) {
                return res.status(400).json({ error: "Vui lòng tải lên cả ảnh bìa và file pdf." });
            }

            const newComic = new Comic({
                namecomic: req.body.name,
                price: req.body.price,
                author: req.body.author,
                publishing_year: req.body.publishing,
                describe: req.body.describe,
                genres: req.body.genre,
                cover_image: coverImage,
                comic_content: pdfComic,

            });

            await newComic.save();
            res.status(200).json({ message: "Post truyện thành công" });
            io.emit('newComicAdded', namecheck);

        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Post truyện không thành công" });
    }

});
app.put('/editcomic/comic/:id', upload.fields([{ name: 'cover_image', maxCount: 1 }, { name: 'pdf_comic', maxCount: 1 }]), async (req, res) => {
    const { name, price, author, publishing, describe, genre } = req.body
    console.log("the loai" + genre)

    try {

        const coverImage = req.files['cover_image'][0].filename;
        const pdfComic = req.files['pdf_comic'][0].filename;

        if (!coverImage || !pdfComic) {
            return res.status(400).json({ error: "Vui lòng tải lên cả ảnh bìa và file pdf." });
        }

        const updateComic = await Comic.findByIdAndUpdate(
            { _id: req.params.id },
            { $set: { namecomic: name, price: price, author: author, publishing_year: publishing, genres: genre, describe: describe, cover_image: coverImage, comic_content: pdfComic } },
            { new: true }
        );

        if (updateComic) {
            res.status(200).json({ message: "Update truyện thành công" })

        }
        else {
            console.error('Update không thành công. Comic ID:', req.params.id);
            return res.status(404).json({ message: 'Update không thành công' });
        }



    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Update truyện không thành công" });
    }

});
app.delete("/deletecomic/:id", async (req, res) => {
    const comicId = req.params.id;
    try {
        const deleteComic = await Comic.findByIdAndDelete(comicId);
        if (deleteComic) {
            res.json({ message: `Xóa truyện thành công` });
        }
        else {
            res.json({ message: `Xóa truyện thất bại` });
        }

    } catch (error) {
        console.error('Error deleting comic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
app.get("/listuser", async (req, res) => {
    try {
        const users = await User.find();
        res.render("Screen/ListUser", { users })
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})
app.delete('/deleteuser/:id', async (req, res) => {
    const userId = req.params.id
    try {
        const deleteUser = await User.findByIdAndDelete(userId);
        if (deleteUser) {
            res.json({ message: ` Xóa User thành công` })
        }
        else {
            res.json({ message: ` Xóa User thất bại` })
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
app.put('/edituser/user/:id', async (req, res) => {
    const userId = req.params.id;
    const { username, password, money, email, fullname } = req.body;

    try {
        const updateUser = await User.findByIdAndUpdate(
            userId,
            { $set: { username, password, money, email, fullname } },
            { new: true }
        );

        if (updateUser) {
            res.json({ message: 'Update User thành công', updateUser });
        } else {
            console.error('Update không thành công. User ID:', userId);
            res.status(404).json({ message: 'Update không thành công' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Update User không thành công' });
    }
});
app.post("/searchComicByName", async (req, res) => {
    const namecomic = req.body.namecomic;
    console.log("ten search" + namecomic)
    try {
        const comics = await Comic.find({ namecomic: { $regex: new RegExp(namecomic, 'i') } })
        res.json(comics)
        console.log("11" + comics)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})
app.post("/searchUserByName", async (req, res) => {
    const nameuser = req.body.username;
    try {
        const users = await User.find({ username: { $regex: new RegExp(nameuser, 'i') } })
        res.json(users)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})
// API local
app.post("/api/signup", async (req, res) => {
    const namecheck = req.body.username
    const existingUser = await User.findOne({ username: namecheck })
    const { username, password, email, fullname } = req.body
    if (existingUser) {
        res.status(400).json({ message: "Tài khoản của đã tồn tại hãy đăng ký tài khoản khác" });
    }
    else {

        const newUser = new User({
            username: username,
            password: password,
            money: 0,
            email: email,
            fullname: fullname
        });
        try {
            const result = await newUser.save();
            res.json({ success: true, result })

        } catch (error) {
            console.log(error);
            res.json({ success: false, error });
        }
    }
})
app.post("/api/signin", async (req, res) => {
    const { username, password } = req.body
    try {
        const user = await User.findOne({ username: username, password: password });
        if (!user) {
            return res.status(404).json({ message: 'Tài khoản mật khẩu không đúng' });
        }
        res.json({ success: true, message: "Đăng nhập thành công", user })
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu đăng nhập:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
})
app.get("/api/username/:username", async (req, res) => {
    const username = req.params.username;
    try {
        const user = await User.findOne({ username: username })
        if (!user) {
            return res.status(404).json({ message: 'người dùng không tồn tại' });
        }
        res.json(user)
    } catch (error) {

    }
})
app.put("/api/updateMoney/:idUser/:money", async (req, res) => {
    const id_user = req.params.idUser; 
    const additionalMoney = req.params.money; 

    try {
        const user = await User.findById(id_user);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const currentMoney = user.money || 0;
        const updatedMoney = parseInt(currentMoney) + parseInt(additionalMoney);

        const updatedUser = await User.findByIdAndUpdate(
            id_user,
            { $set: { money: updatedMoney.toString() } },
            { new: true }
        );

        if (updatedUser) {
            res.json({ message: "Nạp tiền thành công", user: updatedUser });
        } else {
            res.status(404).json({ message: 'Cập nhật số tiền không thành công' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put("/api/changepassword/:idUser", async (req, res) => {
    const id_user = req.params.idUser;
    const newpassword = req.body.password;
    try {
        const user = await User.findByIdAndUpdate(
            id_user,
            { $set: { password: newpassword } },
            { new: true }
        )
        if(user){
            res.json({message:"update password thành công",user})
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
app.get("/api/listcomic", async (req, res) => {
    try {
        const comic = await Comic.find()
        res.json(comic)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
app.get("/api/listcomic/comic/:id", async (req, res) => {
    const id_comic = req.params.id;
    try {
        const comic = await Comic.findById(id_comic)
        res.json(comic)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
app.get("/api/searchComicBypriceAndGenres/:price/:genres", async (req, res) => {
    const price = req.params.price;
    const genres = req.params.genres;

    try {
        if (parseInt(price) === 0) {
            if (genres === "") {
                
                const comics = await Comic.find({ price: 0 });
                res.json(comics);
            } else {
                const comics = await Comic.find({ price: 0, genres: genres });
                res.json(comics);
            }
        } else if (parseInt(price) > 0) {
            if (genres === "") {
                const comics = await Comic.find({ price: { $gt: 0 } });
                res.json(comics);
            } else {
                const comics = await Comic.find({ price: { $gt: 0 }, genres: genres });
                res.json(comics);
            }
        } else if (price == null) {
            if (genres === "Hành Động" || genres === "Trinh Thám" || genres === "Tình Cảm" || genres === "Kinh Dị" || genres === "Anime") {
                const comics = await Comic.find({ genres: genres });
                res.json(comics);
            } else if (genres === "") {
                const comics = await Comic.find({});
                res.json(comics);
            } else {
                res.status(400).json({ error: 'Invalid genres value' });
            }
        } else if (price == null && genres == null) {
            const comics = await Comic.find({});
            res.json(comics);
        } else {
            res.status(400).json({ error: 'Invalid price value' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/searchNameComic/:nameComic",async(req,res) =>{
    const name = req.params.nameComic;
    try {
        const comic = await Comic.findOne({namecomic:name})
        if(comic){
            res.json(comic)
        }
    } catch (error) {
        
    }
})

app.get("/api/user/:id", async (req, res) => {
    const id_user = req.params.id
    try {
        const user = await User.findById(id_user);
        if (!user) {
            return res.status(404).json({ message: 'Không tim thấy user' });
        }
        res.json(user)
    } catch (error) {

    }
})
app.get("/api/countComic/:id", async (req, res) => {
    try {
        const id_user = req.params.id;
        const user = await User.findById(id_user);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy user' });
        }
        const count = await User.aggregate([
            { $match: { _id: user._id } },
            { $unwind: "$your_comic" },
            { $match: { "your_comic.id_user": id_user } },
            { $group: { _id: "$your_comic.id_user", total: { $sum: 1 } } }
        ]);


        if (count.length > 0) {
            res.json(count[0].total);
        } else {
            res.json(count);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
});

app.get("/api/getcommnet/:idComic", async (req, res) => {
    const idComic = req.params.idComic;
    try {
        const comic = await Comic.findById(idComic);
        if (!comic) {
            return res.status(404).json({ message: "không tìm thấy truyện" })
        }
        const comments = comic.comment;
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Đã xảy ra lỗi" });
    }
})
app.put("/api/addcomment/:id", async (req, res) => {
    const idComic = req.params.id

    const { id_user, username, content, date } = req.body
    try {
        const comic = await Comic.findById(idComic)
        if (!comic) {
            return res.status(404).json({ message: 'Không tìm thấy truyện ' });
        }
        comic.comment.push({ id_comic: idComic, id_user: id_user, username: username, content: content, date: date })
        const updateComic = await comic.save()
        res.status(200).json({ message: "Thêm bình luân thành công", updateComic });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
app.delete("/api/deletecomment/:id/:id_comment", async (req, res) => {
    const idUser = req.params.idUser;
    const idComic = req.params.id;
    const idComment = req.params.id_comment;

    try {

        const comic = await Comic.findById(idComic);
        if (!comic) {
            return res.status(404).json({ message: 'Không tìm thấy truyện ' });
        }

        const commentIndex = comic.comment.findIndex(comment => comment._id == idComment);
        if (commentIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận ' });
        }

        comic.comment.splice(commentIndex, 1);
        const updateComic = await comic.save();
        res.status(200).json(updateComic);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.put("/api/editcomment/:id/:id_comment", async (req, res) => {
    const idComic = req.params.id;
    const idComment = req.params.id_comment;
    const { content, date } = req.body;

    try {
        const comic = await Comic.findById(idComic);
        if (!comic) {
            return res.status(404).json({ message: 'Không tìm thấy truyện ' });
        }

        const commentToUpdate = comic.comment.find(comment => comment._id == idComment);
        if (!commentToUpdate) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận ' });
        }

        commentToUpdate.content = content;
        commentToUpdate.date = date;
        const updateComic = await comic.save();
        res.status(200).json(updateComic);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
app.get("/api/listyourcomic/:id", async (req, res) => {
    const id_user = req.params.id;

    try {
        const user = await User.findById(id_user);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        const yourComicList = user.your_comic;
        res.status(200).json(yourComicList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
app.put("/api/yourcomic/:id", async (req, res) => {
    const id_user = req.params.id

    const { id_comic, namecomic, img, date, price } = req.body
    try {
        const user = await User.findById(id_user)
        if (!user) {
            return res.status(404).json({ message: 'Không tìm user nào' });
        }
        user.money = parseInt(user.money - price);

        user.your_comic.push({ id_user: id_user, id_comic: id_comic, namecomic: namecomic, img: img, date: date, price: price })
        const updateUser = await user.save()
        res.status(200).json({ message: "Mua truyện thành công", updateUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
app.delete("/api/deleteyourcomic/:id/:id_yourcomic", async (req, res) => {
    const id_user = req.params.id
    const id_yourcomic = req.params.id_yourcomic
    console.log("aa" + id_yourcomic)
    console.log("aa1" + id_user)
    try {
        const user = await User.findById(id_user);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm user nào ' });
        }
        const yourcomicIndex = user.your_comic.findIndex(your_comic => your_comic._id == id_yourcomic);
        if (yourcomicIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy truyện  ' });
        }

        user.your_comic.splice(yourcomicIndex, 1);
        const updateUser = await user.save();
        res.status(200).json({ message: "Xóa truyện thành công", updateUser });
    } catch (error) {

    }
})
server.listen(port, () => {
    console.log(`server running at the port ${port}`);
});

io.on('connection', (socket) => {
    console.log('A client connected');
});
