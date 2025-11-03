 // -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

// -------------------- FIREBASE ADMIN SETUP --------------------
const serviceAccount = require("./firebase-admin-key.json"); // You’ll create this file below
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// -------------------- CONFIG --------------------
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------- MONGODB CONNECTION --------------------
mongoose
  .connect("mongodb://127.0.0.1:27017/portfolioDB", {
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

// -------------------- MIDDLEWARE: VERIFY ADMIN --------------------
const ADMIN_UID = "JVo2DR6keLQlWwLWGPCidwcIFaC3";

const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "No authorization token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded.uid !== ADMIN_UID)
      return res.status(403).json({ error: "Access denied: Not admin" });

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// -------------------- ROUTES --------------------

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Welcome to Navinraj's Portfolio API 🚀");
});

// ✅ Add new project (Admin only)
app.post("/api/projects", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, description, githubLink, liveLink } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const newProject = new Project({
      title,
      description,
      githubLink,
      liveLink,
      image,
    });

    await newProject.save();
    res.status(201).json({ message: "✅ Project added successfully!" });
  } catch (err) {
    console.error("Error adding project:", err);
    res.status(500).json({ error: "Server error while adding project." });
  }
});

// ✅ Get all projects (Public)
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ _id: -1 });
    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Server error while fetching projects." });
  }
});

// ✅ Upload resume (Admin only)
app.post("/api/resume", verifyAdmin, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Delete old resume
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

    res.status(200).json({ message: "✅ Resume uploaded successfully!", filePath: resumePath });
  } catch (err) {
    console.error("❌ Error uploading resume:", err);
    res.status(500).json({ error: "Server error while uploading resume" });
  }
});

// ✅ Get resume (Public)
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
