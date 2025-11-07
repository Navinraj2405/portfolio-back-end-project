// -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// -------------------- CONFIG --------------------
const app = express();
const PORT = 5000; // You can change this if needed

// ✅ Allow both local & deployed frontends
const allowedOrigins = [
  "http://localhost:5173", // local frontend
  "https://your-frontend-url.vercel.app", // replace with your real frontend deploy URL
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

// ✅ Fix for preflight (OPTIONS) requests — Express v5 compatible
app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------- MONGODB CONNECTION --------------------
mongoose
  .connect("mongodb+srv://navinraj:Atna001@cluster0.grgh9ma.mongodb.net/portfolioDB")
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));


// -------------------- MODELS --------------------

// Project model
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  githubLink: String,
  liveLink: String,
  image: String,
});
const Project = mongoose.model("Project", projectSchema);

// Resume model
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

// ✅ Home route
app.get("/", (req, res) => {
  res.send("🚀 Navinraj Portfolio Backend is Running Successfully!");
});

// ✅ Add new project
app.post("/api/projects", upload.single("image"), async (req, res) => {
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
    console.error("❌ Error adding project:", err);
    res.status(500).json({ error: "Server error while adding project." });
  }
});

// ✅ Get all projects
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ _id: -1 });
    res.status(200).json(projects);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ error: "Server error while fetching projects." });
  }
});

// ✅ Upload resume (only one latest)
app.post("/api/resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Delete old resume if exists
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
    console.error("❌ Error fetching resume:", err);
    res.status(500).json({ error: "Server error while fetching resume" });
  }
});

// -------------------- START SERVER --------------------
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
