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
    status: String,
    issueDate: Date,
    returnDate: Date
});

// ✅ RESERVATION MODEL ADD
const Reservation = mongoose.model("Reservation", {
    user: String,
    book: String,
    status: String
});

/* ================= TEST ================= */

app.get("/", (req,res)=>{
    res.send("Server OK");
});

/* ================= LOGIN ================= */

app.post("/api/login", async (req,res)=>{
    try{
        const {username,password} = req.body;

        const user = await User.findOne({username,password});

        if(!user){
            return res.json({success:false});
        }

        res.json({success:true,user});
    }
    catch(err){
        console.log("LOGIN ERROR:", err);
        res.json({success:false});
    }
});

/* ================= BOOK ================= */

app.get("/api/books", async (req,res)=>{
    try{
        const books = await Book.find();
        res.json(books);
    }catch(err){
        console.log(err);
        res.json([]);
    }
});

/* ================= ISSUE ================= */

app.post("/api/issue", async (req,res)=>{
    try{
        const {student,book} = req.body;

        let issueDate = new Date();

        // 🔥 return date = 2 days (demo)
        let returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 2);

        const r = new Request({
            user: student.trim(),
            book: book.trim(),
            status: "Issued",
            issueDate,
            returnDate
        });

        await r.save();

        res.json({success:true});
    }
    catch(err){
        console.log("ISSUE ERROR:", err);
        res.json({success:false});
    }
});

/* ================= RETURN ================= */

app.post("/api/return", async (req,res)=>{
    try{
        const {student,book} = req.body;

        const result = await Request.deleteMany({
            user: student.trim(),
            book: book.trim()
        });

        console.log("DELETE RESULT:", result);

        res.json({success:true});
    }
    catch(err){
        console.log("RETURN ERROR:", err);
        res.json({success:false});
    }
});
/* ================= REQUEST ================= */

app.get("/api/requests", async (req,res)=>{
    try{
        const data = await Request.find();
        res.json(data);
    }catch(err){
        console.log(err);
        res.json([]);
    }
});

/* ================= RESERVATION ================= */

app.get("/api/reservations", async (req,res)=>{
    try{
        const data = await Reservation.find();
        res.json(data);
    }catch(err){
        console.log("RES ERROR:", err);
        res.json([]);
    }
});

/* ================= NOTIFICATION ================= */


app.get("/api/notifications", async (req,res)=>{
    try{
        let today = new Date();

        let requests = await Request.find();

        let notifications = [];
        let unique = new Set();

        requests.forEach(r=>{
            if(!r.returnDate) return;

            // 🔥 date normalize (important fix)
            let returnDate = new Date(r.returnDate);
            let diff = Math.ceil(
                (returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            // 🔥 relaxed condition (main fix)
            if(diff <= 3 && diff >= 0 && !unique.has(r.book)){
                unique.add(r.book);

                notifications.push({
                    message: `${r.book} must be returned soon`
                });
            }
        });

        res.json(notifications);

    }catch(err){
        console.log("NOTI ERROR:", err);
        res.json([]);
    }
});

/* ================= START ================= */

app.listen(5000,()=>{
    console.log("🔥 Server running on http://127.0.0.1:5000");
});