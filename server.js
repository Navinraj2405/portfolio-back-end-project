 // -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// -------------------- CONFIG --------------------
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------- MONGODB CONNECTION --------------------
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://navinraj:Atna001@cluster0.grgh9ma.mongodb.net/portfolioDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// -------------------- MODELS --------------------
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  githubLink: String,
  liveLink: String,
  image: String,
});
const Project = mongoose.model("Project", projectSchema);

const resumeSchema = new mongoose.Schema({
  fileName: String,
  filePath: String,
  uploadedAt: { type: Date, default: Date.now },
});
const Resume = mongoose.model("Resume", resumeSchema);

// -------------------- MULTER SETUP --------------------
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// -------------------- ROUTES --------------------

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Welcome to Navinraj's Portfolio API 🚀 (No Firebase)");
});

// ✅ Add new project
app.post("/api/projects", upload.single("image"), async (req, res) => {
  try {
    const { title, description, githubLink, liveLink } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";
    const newProject = new Project({ title, description, githubLink, liveLink, image });
    await newProject.save();
    res.status(201).json({ message: "✅ Project added successfully!" });
  } catch (err) {
    console.error("Error adding project:", err);
    res.status(500).json({ error: "Server error while adding project." });
  }
});

// ✅ Get all projects
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ _id: -1 });
    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Server error while fetching projects." });
  }
});

// ✅ Upload resume
app.post("/api/resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const oldResume = await Resume.findOne();
    if (oldResume) {
      const oldPath = path.join(__dirname, oldResume.filePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      await Resume.deleteMany({});
    }

    const resumePath = `/uploads/${req.file.filename}`;
    const newResume = new Resume({
      fileName: req.file.originalname,
      filePath: resumePath,
    });
    await newResume.save();

    res.status(200).json({
      message: "✅ Resume uploaded successfully!",
      filePath: resumePath,
    });
  } catch (err) {
    console.error("❌ Error uploading resume:", err);
    res.status(500).json({ error: "Server error while uploading resume" });
  }
});

// ✅ Get latest resume
app.get("/api/resume", async (req, res) => {
  try {
    const resume = await Resume.findOne().sort({ uploadedAt: -1 });
    if (!resume) return res.status(404).json({ message: "No resume found" });
    res.status(200).json(resume);
  } catch (err) {
    console.error("Error fetching resume:", err);
    res.status(500).json({ error: "Server error while fetching resume" });
  }
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
