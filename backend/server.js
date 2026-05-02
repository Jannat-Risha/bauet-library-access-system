const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

console.log("🚀 Server starting...");

app.use(cors({ origin: "*" }));
app.use(express.json());

/* ================= DB CONNECT ================= */

mongoose.connect("mongodb://127.0.0.1:27017/libraryDB")
.then(()=>console.log("✅ DB Connected"))
.catch(err=>console.log("❌ DB ERROR:", err));

/* ================= MODELS ================= */

const User = mongoose.model("User", {
    username: String,
    password: String,
    role: String
});

const Book = mongoose.model("Book", {
    name: String,
    author: String,
    status: String
});

const Request = mongoose.model("Request", {
    user: String,
    book: String,
    status: String
});

const Reservation = mongoose.model("Reservation", {
    user: String,
    book: String,
    status: String
});

const Complaint = mongoose.model("Complaint", {
    user: String,
    issue: String,
    status: String
});

const Notification = mongoose.model("Notification", {
    message: String,
    type: String
});

/* ================= TEST ================= */

app.get("/", (req,res)=>{
    res.send("Server OK");
});

/* ================= LOGIN ================= */

app.post("/api/login", async (req,res)=>{
    try{
        console.log("LOGIN TRY:", req.body);

        const {username,password} = req.body;

        const user = await User.findOne({username,password});

        if(!user){
            return res.json({success:false});
        }

        res.json({success:true,user});
    }
    catch(err){
        console.log("LOGIN ERROR:", err);
        res.status(500).json({success:false});
    }
});

/* ================= BOOK ================= */

app.get("/api/books", async (req,res)=>{
    res.json(await Book.find());
});

app.post("/api/books", async (req,res)=>{
    const {name,author} = req.body;

    const book = new Book({
        name,
        author,
        status:"Available"
    });

    await book.save();
    res.json(book);
});

/* ================= REQUEST ================= */

app.get("/api/requests", async (req,res)=>{
    res.json(await Request.find());
});

app.post("/api/approve/:id", async (req,res)=>{
    const r = await Request.findById(req.params.id);

    if(r){
        r.status="Approved";
        await r.save();
    }

    res.json(r);
});

/* ================= RESERVATION ================= */

app.get("/api/reservations", async (req,res)=>{
    res.json(await Reservation.find());
});

app.post("/api/reservations", async (req,res)=>{
    const {user,book} = req.body;

    const r = new Reservation({
        user,
        book,
        status:"Pending"
    });

    await r.save();
    res.json(r);
});

/* ================= COMPLAINT ================= */

app.get("/api/complaints", async (req,res)=>{
    res.json(await Complaint.find());
});

app.post("/api/complaints", async (req,res)=>{
    const {user,issue} = req.body;

    const c = new Complaint({
        user,
        issue,
        status:"Pending"
    });

    await c.save();
    res.json(c);
});

/* ================= NOTIFICATION ================= */

app.get("/api/notifications", async (req,res)=>{
    res.json(await Notification.find());
});

/* ================= START ================= */

app.listen(5000,()=>{
    console.log("🔥 Server running on http://127.0.0.1:5000");
});