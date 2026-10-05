import express from "express";
import cors from "cors";
import auth from "./routes/auth.js";
import teachers from "./routes/teachers.js";
import students from "./routes/students.js";
import assignments from "./routes/assignments.js";
import attendance from "./routes/attendance.js";
import settings from "./routes/settings.js";
import { crud } from "./routes/crud.js";
import Class from "./models/Class.js";
import Subject from "./models/Subject.js";
import Student from "./models/Student.js";
import Assignment from "./models/PeriodAssignment.js";
import Exam from "./models/Exam.js";
import exams from "./routes/exams.js";
import classAttendance from "./routes/classAttendance.js";
import results from "./routes/results.js";
import dashboard from "./routes/dashboard.js";
import profile from "./routes/profile.js";
import leaves from "./routes/leaves.js";
import reports from "./routes/reports.js";
import publicRoutes from "./routes/public.js";
import site from "./routes/site.js";
import enquiries from "./routes/enquiries.js";
import { mediaCrud } from "./routes/media.js";
import GalleryItem from "./models/GalleryItem.js";
import Post from "./models/Post.js";
import Holiday from "./models/Holiday.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "https://my-school-963be.web.app/",
    ],
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", auth);
app.use(
  "/api/classes",
  crud(Class, {
    sort: "name section",
    inUse: async (id) =>
      !!(
        (await Student.exists({ class: id })) ||
        (await Assignment.exists({ class: id })) ||
        (await Exam.exists({ class: id }))
      ),
  }),
);
app.use(
  "/api/subjects",
  crud(Subject, {
    sort: "name",
    inUse: async (id) =>
      !!(
        (await Assignment.exists({ subject: id })) ||
        (await Exam.exists({ subject: id }))
      ),
  }),
);
app.use("/api/teachers", teachers);
app.use("/api/students", students);
app.use("/api/assignments", assignments);
app.use("/api/attendance", attendance);
app.use("/api/settings", settings);
app.use("/api/exams", exams);
app.use("/api/class-attendance", classAttendance);
app.use("/api/results", results);
app.use("/api/dashboard", dashboard);
app.use("/api/profile", profile);
app.use("/api/leaves", leaves);
app.use("/api/reports", reports);
app.use("/api/public", publicRoutes);
app.use("/api/site", site);
app.use("/api/enquiries", enquiries);
app.use(
  "/api/gallery",
  mediaCrud(GalleryItem, {
    folder: "gallery",
    fields: ["caption", "category"],
    sort: "-createdAt",
    imageRequired: true,
  }),
);
app.use(
  "/api/posts",
  mediaCrud(Post, {
    folder: "posts",
    fields: ["title", "type", "date", "body"],
    sort: "-date",
  }),
);
app.use("/api/holidays", crud(Holiday, { sort: "startDate" }));
app.use(notFound);
app.use(errorHandler);

export default app;
