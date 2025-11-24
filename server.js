 // -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// -------------------- CONFIG --------------------
const app = express();
const PORT = 5000;

// Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://navinraj.netlify.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.options("/*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- FIX: RENDER PERSISTENT UPLOAD PATH --------------------
const uploadFolder = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Serve uploads
app.use("/uploads", express.static(uploadFolder));

// -------------------- MONGODB CONNECTION --------------------
mongoose
  .connect("mongodb+srv://navinraj:Atna001@cluster0.grgh9ma.mongodb.net/portfolioDB?appName=Cluster0")
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

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

// -------------------- MULTER --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// -------------------- ROUTES --------------------

// Home
app.get("/", (req, res) => {
  res.send("🚀 Portfolio Backend Running Successfully!");
});

// -------------------- ADD PROJECT --------------------
app.post("/api/projects", upload.single("image"), async (req, res) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const newProject = new Project({
      ...req.body,
      image,
    });

    await newProject.save();

    res.status(201).json({ message: "✅ Project added successfully!" });
  } catch (err) {
    console.error("❌ Error adding project:", err);
    res.status(500).json({ error: "Server error while adding project." });
  }
});

// -------------------- GET ALL PROJECTS --------------------
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ _id: -1 });
    res.status(200).json(projects);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ error: "Server error while fetching projects." });
  }
});

// -------------------- UPLOAD RESUME --------------------
app.post("/api/resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    await Resume.deleteMany({});

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

// -------------------- GET LATEST RESUME --------------------
app.get("/api/resume", async (req, res) => {
  try {
    const resume = await Resume.findOne().sort({ uploadedAt: -1 });
    if (!resume) return res.status(404).json({ message: "No resume found" });

    res.status(200).json(resume);
  } catch (err) {
    console.error("❌ Error fetching resume:", err);
    res.status(500).json({ error: "Server error while fetching resume" });
  }
});

// -------------------- START --------------------
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
