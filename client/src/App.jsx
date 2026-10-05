import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import { Classes, Subjects, Teachers, Students } from './pages/Manage.jsx';
import Timetable from './pages/Timetable.jsx';
import AttendanceReport from './pages/AttendanceReport.jsx';
import Settings from './pages/Settings.jsx';
import TeacherHome from './pages/TeacherHome.jsx';
import AdminExams from './pages/AdminExams.jsx';
import TeacherExams from './pages/TeacherExams.jsx';
import Results from './pages/Results.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminHolidays from './pages/AdminHolidays.jsx';
import AdminLeaves from './pages/AdminLeaves.jsx';
import AttendanceReports from './pages/AttendanceReports.jsx';
import TeacherLeaves from './pages/TeacherLeaves.jsx';
import TeacherProfile from './pages/TeacherProfile.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import AdminSite from './pages/AdminSite.jsx';
import AdminGallery from './pages/AdminGallery.jsx';
import AdminPosts from './pages/AdminPosts.jsx';
import AdminEnquiries from './pages/AdminEnquiries.jsx';
import PublicLayout from './site/PublicLayout.jsx';
import SiteHome from './site/Home.jsx';
import About from './site/About.jsx';
import Faculty from './site/Faculty.jsx';
import Gallery from './site/Gallery.jsx';
import News from './site/News.jsx';
import Contact from './site/Contact.jsx';
import TeacherMarks from './pages/TeacherMarks.jsx';
import StudentAttendance from './components/StudentAttendance.jsx';

function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="pad">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/teacher'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<SiteHome />} />
        <Route path="/about" element={<About />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/news" element={<News />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Guard role="admin"><Layout /></Guard>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<AttendanceReport />} />
        <Route path="classes" element={<Classes />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="exams" element={<AdminExams />} />
        <Route path="results" element={<Results />} />
        <Route path="student-attendance" element={<StudentAttendance readOnly />} />
        <Route path="reports" element={<AttendanceReports />} />
        <Route path="leaves" element={<AdminLeaves />} />
        <Route path="holidays" element={<AdminHolidays />} />
        <Route path="website" element={<AdminSite />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="enquiries" element={<AdminEnquiries />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/teacher" element={<Guard role="teacher"><Layout /></Guard>}>
        <Route index element={<TeacherHome />} />
        <Route path="exams" element={<TeacherExams />} />
        <Route path="marks" element={<TeacherMarks />} />
        <Route path="leaves" element={<TeacherLeaves />} />
        <Route path="profile" element={<TeacherProfile />} />
        <Route path="results" element={<Results />} />
        <Route path="attendance" element={<StudentAttendance />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
