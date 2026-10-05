# School Manager (MERN)

Admin and teacher logins. Admin manages classes, subjects, teachers, students and the period timetable.
Teachers check in once a day, and only from inside the school's allowed radius.

## Run locally

Requires Node 18+ and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd server
cp .env.example .env      # fill MONGO_URI, JWT_SECRET, Cloudinary keys
npm install
npm run seed              # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev               # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173 (proxies /api to :5000)
```

Log in as the admin, then:
1. **Settings**: set the school's coordinates (use "Use my current location" while at school), radius, late-after time, timezone.
2. Add **Classes** and **Subjects**, then **Teachers** (each gets a login) and **Students**.
3. **Timetable**: pick a class, click a slot, assign subject and teacher.
4. Teachers log in and tap **Check in** once a day.

## Notes
- Browser geolocation needs **HTTPS** in production (localhost is fine for development).
- The distance check, date and late status are all decided on the server. Coordinates from a browser can still be faked, so review the "Distance" column in the attendance report.
- Timetable clashes are blocked by unique DB indexes (teacher + day + period, class + day + period).
- Photos upload to Cloudinary (max 2 MB); only the URL and public id are stored.

## API summary
| Route | Who | Purpose |
|---|---|---|
| `POST /api/auth/login`, `GET /api/auth/me` | all | Auth |
| `/api/classes`, `/api/subjects` | read: any user, write: admin | CRUD |
| `/api/teachers`, `/api/students` | admin | CRUD + photo upload |
| `/api/assignments` | admin (`/mine` for teacher) | Timetable |
| `POST /api/attendance/check-in`, `GET /today`, `GET /mine` | teacher | Daily check-in |
| `GET /api/attendance?date=` | admin | Present/late/absent per teacher |
| `GET/PUT /api/settings` | admin | School location, radius, cutoff |

## Exams and student attendance
- **Admin > Exams**: schedule an exam (class, subject, date, max marks). Delete or edit any time.
- **Teacher > Exams**: a teacher sees exams only for class + subject pairs assigned to them in the timetable. They upload the test paper (PDF or image, max 10 MB) and, from the exam date onward, enter each student's score or mark them absent.
- **Teacher > Class attendance**: pick a class they teach and a date (today or earlier), mark present / late / absent, save. Re-saving a date updates that register.
- **Admin > Student attendance**: read-only view of any class and date.
- Cloudinary note: new accounts may block delivery of PDFs. If "View paper" fails for PDFs, enable **Settings > Security > "PDF and ZIP files delivery"** in your Cloudinary console.

## Results and report cards
- **Results > Exam results**: pick an exam to see every student's marks, rank, grade and pass/fail, plus class average, highest, lowest and pass rate.
- **Results > Student reports**: pick a class to see every student's total, overall %, grade, rank and attendance %. "Report card" opens one student's full report (all exams, subject-wise totals, attendance) with a Print button.
- Admin can view all exams and classes. A teacher sees results only for exams they are assigned to (class + subject) and reports for classes they teach.
- Pass mark is set in **Settings** (default 33%). Grades: A+ 90+, A 80+, B+ 70+, B 60+, C 50+, D from the pass mark, F below it. Edit `gradeOf` in `server/src/routes/results.js` to change the bands.
- Overall % counts only exams where a score was entered. Absent and pending exams are excluded from the total.
