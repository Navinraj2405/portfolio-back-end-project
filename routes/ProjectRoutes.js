// const express = require('express');
// const multer = require('multer');
// const Project = require('../models/Project');

// const router = express.Router();

// // Multer storage configuration for image uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ storage: storage });

// // POST: Add a project
// router.post('/', upload.single('image'), async (req, res) => {
//   const { title, description, githubLink, liveLink } = req.body;
//   const image = req.file.path; // Store the uploaded image path

//   const newProject = new Project({
//     title,
//     description,
//     githubLink,
//     liveLink,
//     image,
//   });

//   try {
//     await newProject.save();
//     res.status(201).json({ message: 'Project added successfully!' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error saving project', error });
//   }
// });

// // GET: Fetch all projects
// router.get('/', async (req, res) => {
//   try {
//     const projects = await Project.find();
//     res.status(200).json(projects);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching projects', error });
//   }
// });

// module.exports = router;
