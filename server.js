const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public papkani ochiq qilish
app.use(express.static("public"));

// MongoDB ulanish
mongoose.connect("mongodb://127.0.0.1:27017/telegramclone")
  .then(() => console.log("MongoDB ulandi"))
  .catch(err => console.error("MongoDB ulanish xatosi:", err));

// Foydalanuvchi modeli
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model("User", UserSchema);

// Ro‘yxatdan o‘tish
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).send("Bu login band!");

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashed });
    await newUser.save();

    res.send("Ro‘yxatdan o‘tish muvaffaqiyatli");
  } catch (err) {
    res.status(500).send("Xato: " + err.message);
  }
});

// Kirish
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send("Login topilmadi");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).send("Parol xato");

    res.send("Kirish muvaffaqiyatli");
  } catch (err) {
    res.status(500).send("Xato: " + err.message);
  }
});

// Chat qismi
io.on("connection", (socket) => {
  console.log("Yangi foydalanuvchi ulandi:", socket.id);

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("Foydalanuvchi chiqib ketdi:", socket.id);
  });
});

// Serverni ishga tushirish
server.listen(PORT, () => {
  console.log("Server " + PORT + "-portda ishlayapti");
});