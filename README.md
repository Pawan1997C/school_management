# School Manager (MERN)

Admin panel (sidebar layout, dashboard, searchable tables with add/edit dialogs) and a teacher portal. Admin manages classes, subjects, teachers, students and the period timetable.
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

## Admin panel layout
- Sidebar navigation grouped by Academics, People, Exams, Attendance and System; it becomes a slide-in menu on phones.
- **Dashboard** (`GET /api/dashboard`): totals, today's teacher and student attendance, upcoming exams, students per class.
- List pages (Classes, Subjects, Teachers, Students, Exams) share one component: search box, table, and an add/edit dialog.

## Timetable, branding, holidays and leaves
- **Settings > Period timings**: set start/end time for each period (up to 12). Times show in the timetable and on the teacher's home page. Periods can only be added or removed at the end, so existing timetable entries keep their period number.
- **Timetable**: choosing a teacher for a period can fill several days at once (defaults to every day that period is still free). Days where the class already has a teacher, or the teacher is teaching another class, are skipped and listed. A filled slot can be removed for one day or for all days.
- **Settings > School profile**: school name and logo appear in the sidebar and browser tab title.
- Students and teachers without a photo get a coloured avatar with first-name and surname initials.
- **Teacher > My profile**: edit name, phone, photo and password. Email, employee ID and subjects stay admin-managed.
- **Admin > Holidays**: single days or date ranges; weekly off days are set in Settings. **Teacher > My leaves**: apply (from today onward), cancel while pending. **Admin > Leave requests**: approve or reject with a note.
- Holidays and approved leave days: teachers cannot check in, student registers cannot be saved on holidays, and teacher attendance shows "holiday" or "on leave" instead of "absent".

## Monthly attendance reports
**Admin > Monthly reports**: pick Teachers or Students and a month (students can be filtered by class).
- Shows days present (late counts as present), late, leave (teachers), absent and attendance %, next to the previous month's absent days and %, with the change in percentage points.
- **Download CSV** (opens in Excel or Google Sheets) or **Print / save as PDF**.
- Teachers: working days exclude weekly offs and holidays, days before the teacher was added are not counted, and approved leave is left out of the percentage. The current month is counted up to yesterday, since today is still in progress.
- Students: based on the registers teachers saved; days with no register are not counted.
- API: `GET /api/reports/attendance?type=teachers|students&month=YYYY-MM[&classId=]`.

## Student marks, pagination and ID cards
- **Teacher > Exam papers**: upload or replace the test paper. **Teacher > Enter marks**: pick an exam, then enter marks student by student (Enter moves to the next student, "Pending only" filter, unsaved rows highlighted, one Save button). Marks open on the exam date and are capped at the exam's maximum.
- **Admin > Students**: server-side search, class filter and pagination (10/25/50 rows). `GET /api/students?classId=&q=&page=&limit=`. Other list pages paginate in the browser.
- **Student profile** (`/admin/students/:id`, via the name or "ID card" button): ID-card layout with school logo and name, photo or initials, class, roll number, guardian details and an ID number, plus overall marks, grade and attendance. "Print ID card" prints it at credit-card size (85.6 x 54 mm).
- The ID number is generated from the school initials, the year the student was added and the last 4 characters of the record id, for example `SM-2026-A3F9`. It is not stored.

## Check-in and check-out
- Teachers get one button on their home page. Before the cut-off (default **2:00 PM**, set in Settings as "Check-in closes / check-out opens at") it says **Check in**. From the cut-off it becomes **Check out**.
- The button is disabled whenever there is nothing to do: before the cut-off after checking in ("Check-out opens at 2:00 PM"), after the cut-off if the teacher never checked in (check-in is closed), and once checked out.
- Check-out uses the same location rule as check-in (inside the school radius). The server decides all of this using the school's timezone, so changing the device clock does not help. The page re-checks every minute, so the button flips without a refresh.
- Check-out time is shown in the teacher's recent attendance and in Admin > Teacher attendance. Present/late status still comes from check-in only.

## Public school website
The home page (`/`) is now the school's public landing page. Staff sign in from **Staff login** (`/login`); the admin panel stays at `/admin`, teachers at `/teacher`.

Pages: **Home**, **About Us**, **Faculties**, **Gallery**, **News & Events**, **Contact** (with an enquiry form and a live OpenStreetMap map).

**What the admin controls** (sidebar > Website):
- **Site content**: banner headline, sub-headline, button and image; the numbers strip; About text, mission and vision; principal's message and photo; admissions banner on/off; address, phone, email, hours, optional map coordinates; social links; footer tagline.
- **Gallery**: upload photos with a caption and an album; visitors can filter by album and open a full-screen viewer.
- **News and events**: posts with a date, type and optional image.
- **Enquiries**: messages from the contact form, with mark-as-read and delete.
- **Faculties**: comes from the Teachers list. Each teacher has designation, qualification and short bio fields plus a "Show on website" tick box. Only name, photo, designation, qualification, bio and subjects are public. Emails and phone numbers are never exposed.
- School name and logo (Settings) appear in the website header and footer too.

Notes:
- The map uses the school location from Settings unless you enter different coordinates under Site content. No API key is needed.
- Public endpoints live under `/api/public/*` and need no login. The enquiry form has a hidden spam field and allows 5 messages per hour per IP.
- Links you save (social, banner button) must start with `https://` (the banner button may also be a path like `/contact`).

## Timetable and holidays
- The timetable greys out weekly-off days, and shows Sunday only when Sunday is not a weekly off. Assignments on weekly-off days are rejected by the server.
- Teacher home shows "No classes today" on holidays and weekly offs.
- Scheduling an exam on a holiday or weekly off shows a warning (the admin can still go ahead) and the exam list marks it "Off day".
