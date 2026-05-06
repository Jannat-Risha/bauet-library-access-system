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

const Reservation = mongoose.model("Reservation", {
    user: String,
    book: String,
    status: String
});

const Complaint = mongoose.model("Complaint", {
    user: String,
    type: String,
    message: String,
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

        // 🔥 FIXED (আগে updateOne ছিল)
        await Book.updateMany(
            { name: book.trim() },
            { $set: { status: "Issued" } }
        );

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

        await Request.deleteMany({
            user: student.trim(),
            book: book.trim()
        });

        // 🔥 FIXED (আগে updateOne ছিল)
        await Book.updateMany(
            { name: book.trim() },
            { $set: { status: "Available" } }
        );

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

            let returnDate = new Date(r.returnDate);
            let diff = Math.ceil(
                (returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

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

/* ================= COMPLAINT ================= */

console.log("🔥 COMPLAINT ROUTE LOADED");

app.get("/api/complaints", async (req,res)=>{
    try{
        const data = await Complaint.find();
        res.json(data);
    }catch(err){
        console.log("COMPLAINT GET ERROR:", err);
        res.json([]);
    }
});

app.post("/api/complaints", async (req,res)=>{
    try{
        const {user, type, message} = req.body;

        if(!user || !type || !message){
            return res.json({success:false});
        }

        const c = new Complaint({
            user,
            type,
            message,
            status: "Pending"
        });

        await c.save();

        res.json({success:true});
    }
    catch(err){
        console.log("COMPLAINT POST ERROR:", err);
        res.json({success:false});
    }
});

/* ================= PROFILE ================= */

app.get("/api/profile/:id", async (req,res)=>{
    try{
        const user = await User.findOne({username: req.params.id});

        if(!user){
            return res.json(null);
        }

        res.json(user);
    }
    catch(err){
        console.log("PROFILE ERROR:", err);
        res.json(null);
    }
});
/* ================= ADMIN ================= */

// 🔥 TOTAL BOOKS
app.get("/api/admin/total-books", async (req,res)=>{
    try{
        const count = await Book.countDocuments();
        res.json({total: count});
    }catch(err){
        res.json({total:0});
    }
});

// 🔥 ISSUED BOOKS
app.get("/api/admin/issued-books", async (req,res)=>{
    try{
        const count = await Book.countDocuments({status:"Issued"});
        res.json({total: count});
    }catch(err){
        res.json({total:0});
    }
});

// 🔥 PENDING REQUESTS (FIXED ✅)
app.get("/api/admin/pending-requests", async (req,res)=>{
    try{
        const count = await Request.countDocuments({status:"Pending"});
        res.json({total: count});
    }catch(err){
        res.json({total:0});
    }
});

// 🔥 RECENT REQUESTS (FIXED)
app.get("/api/admin/recent-requests", async (req,res)=>{
    try{
        const data = await Request.find().sort({_id:-1}).limit(5);

        if(!data || data.length === 0){
            return res.json([]);
        }

        res.json(data);
    }catch(err){
        console.log("RECENT REQUEST ERROR:", err);
        res.json([]);
    }
});

// 🔥 APPROVE REQUEST
app.post("/api/admin/approve", async (req,res)=>{
    try{
        const {id} = req.body;

        await Request.findByIdAndUpdate(id,{
            status:"Approved"
        });

        res.json({success:true});
    }catch(err){
        res.json({success:false});
    }
});

// 🔥 ADD BOOK
app.post("/api/admin/add-book", async (req,res)=>{
    try{
        const {name, author} = req.body;

        const b = new Book({
            name,
            author,
            status:"Available"
        });

        await b.save();

        res.json({success:true});
    }catch(err){
        res.json({success:false});
    }
});

// 🔥 DELETE BOOK
app.delete("/api/admin/delete-book/:id", async (req,res)=>{
    try{
        await Book.findByIdAndDelete(req.params.id);
        res.json({success:true});
    }catch(err){
        res.json({success:false});
    }
});

// 🔥 RESOLVE COMPLAINT
app.post("/api/admin/resolve-complaint", async (req,res)=>{
    try{
        const {id} = req.body;

        await Complaint.findByIdAndUpdate(id,{
            status:"Resolved"
        });

        res.json({success:true});
    }catch(err){
        res.json({success:false});
    }
});

/* ================= START ================= */

app.listen(5000,()=>{
    console.log("🔥 Server running on http://127.0.0.1:5000");
});