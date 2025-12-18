import express from "express";
import upload from "../middleware/fileupload.js";
import { handleUpload } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/", upload.single("file"), handleUpload);

export default router;