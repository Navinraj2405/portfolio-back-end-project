 // -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// -------------------- CONFIG --------------------
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://navinraj.netlify.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.options("/*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- FIX FOR RENDER --------------------
const uploadFolder = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Serve uploads
app.use("/uploads", express.static(uploadFolder));

// -------------------- MONGODB --------------------
mongoose
  .connect(process.env.MONGO_URI || "mongodb+srv://...")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// -------------------- MULTER SETUP --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// -------------------- MODELS --------------------
const Project = mongoose.model(
  "Project",
  new mongoose.Schema({
    title: String,
    description: String,
    githubLink: String,
    liveLink: String,
    image: String,
  })
);

const Resume = mongoose.model(
  "Resume",
  new mongoose.Schema({
    fileName: String,
    filePath: String,
    uploadedAt: { type: Date, default: Date.now },
  })
);

// -------------------- ROUTES --------------------

// Add Project
app.post("/api/projects", upload.single("image"), async (req, res) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const newProject = new Project({
      ...req.body,
      image,
    });

    await newProject.save();
    res.json({ message: "Project added successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get Projects
app.get("/api/projects", async (req, res) => {
  const projects = await Project.find().sort({ _id: -1 });
  res.json(projects);
});

// Upload Resume
app.post("/api/resume", upload.single("resume"), async (req, res) => {
  try {
    const resumePath = `/uploads/${req.file.filename}`;

    await Resume.deleteMany({});
    const newResume = await Resume.create({
      fileName: req.file.originalname,
      filePath: resumePath,
    });

    res.json({ message: "Resume uploaded!", filePath: resumePath });
  } catch (err) {
    res.status(500).json("Error uploading resume");
  }
});

// Get Resume
app.get("/api/resume", async (req, res) => {
  const resume = await Resume.findOne().sort({ uploadedAt: -1 });
  if (!resume) return res.status(404).json({ msg: "No resume found" });
  res.json(resume);
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
