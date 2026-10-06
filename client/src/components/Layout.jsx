import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SchoolProvider, useSchool } from '../context/SchoolContext.jsx';
import { applyAdminTheme, clearAdminTheme } from '../utils/themes.js';
import Avatar, { initialsOf } from './Avatar.jsx';
import Icon from './Icon.jsx';

// [path, label, icon]
const NAV = {
  admin: [
    { group: 'Overview', items: [['dashboard', 'Dashboard', 'dashboard']] },
    { group: 'Academics', items: [['classes', 'Classes', 'classes'], ['subjects', 'Subjects', 'subjects'], ['timetable', 'Timetable', 'timetable']] },
    { group: 'People', items: [['teachers', 'Teachers', 'teachers'], ['students', 'Students', 'students']] },
    { group: 'Exams', items: [['exams', 'Exams', 'exams'], ['results', 'Results', 'results']] },
    { group: 'Attendance', items: [['attendance', 'Teacher attendance', 'attendance'], ['student-attendance', 'Student attendance', 'roll'], ['reports', 'Monthly reports', 'results'], ['leaves', 'Leave requests', 'leave'], ['holidays', 'Holidays', 'holiday']] },
    { group: 'Website', items: [['website', 'Site content', 'globe'], ['gallery', 'Gallery', 'image'], ['posts', 'News and events', 'news'], ['enquiries', 'Enquiries', 'mail']] },
    { group: 'System', items: [['settings', 'Settings', 'settings']] },
  ],
  teacher: [
    { group: 'Overview', items: [['', 'My day', 'dashboard']] },
    { group: 'Classroom', items: [['attendance', 'Class attendance', 'roll'], ['exams', 'Exam papers', 'exams'], ['marks', 'Enter marks', 'edit'], ['results', 'Results', 'results']] },
    { group: 'Account', items: [['leaves', 'My leaves', 'leave'], ['profile', 'My profile', 'user']] },
  ],
};

function Shell() {
  const { user, logout } = useAuth();
  const { school } = useSchool();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const base = `/${user.role}`;
  const groups = NAV[user.role];
  const flat = groups.flatMap((g) => g.items);
  const here = flat.find(([p]) => pathname === (p ? `${base}/${p}` : base)) || flat.find(([p]) => p && pathname.startsWith(`${base}/${p}/`));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { if (school.theme?.admin) applyAdminTheme(school.theme.admin, { persist: true }); }, [school.theme?.admin]);
  useEffect(() => () => clearAdminTheme(), []);

  const chip = (
    <>
      <Avatar name={user.name} url={user.photo} size={36} />
      <div><b>{user.name}</b><small>{user.role}</small></div>
    </>
  );

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="side-brand">
          {school.logo ? <img className="logo logo-img" src={school.logo} alt="" /> : <span className="logo">{initialsOf(school.schoolName)}</span>}
          <div><strong>{school.schoolName}</strong><small>{user.role === 'admin' ? 'Admin panel' : 'Teacher portal'}</small></div>
        </div>
        <nav className="side-nav" aria-label="Main">
          {groups.map((g) => (
            <div key={g.group}>
              <p className="side-group">{g.group}</p>
              {g.items.map(([p, label, icon]) => (
                <NavLink key={p} to={p ? `${base}/${p}` : base} end={!p}><Icon name={icon} /><span>{label}</span></NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <a className="side-logout" href="/" target="_blank" rel="noreferrer"><Icon name="globe" /><span>View website</span></a>
          <button className="side-logout" onClick={() => { logout(); nav('/login'); }}><Icon name="logout" /><span>Log out</span></button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" size={20} /></button>
          <span className="crumb">{here ? here[1] : school.schoolName}</span>
          {user.role === 'teacher'
            ? <Link className="user-chip" to="/teacher/profile" style={{ color: 'inherit', textDecoration: 'none' }}>{chip}</Link>
            : <div className="user-chip">{chip}</div>}
        </header>
        <main className="pad"><Outlet /></main>
      </div>
    </div>
  );
}

export default function Layout() {
  return <SchoolProvider><Shell /></SchoolProvider>;
}
