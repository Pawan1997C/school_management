import { useEffect, useState } from 'react';
import api from '../api';
import CrudPage from '../components/CrudPage.jsx';
import { useSchool } from '../context/SchoolContext.jsx';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdminExams() {
  const { school } = useSchool();
  const [holidays, setHolidays] = useState([]);
  useEffect(() => { api.get('/holidays').then((r) => setHolidays(r.data)).catch(() => {}); }, []);

  // Why this date is not a normal school day (or null). Only a warning: the admin can still schedule the exam.
  const why = (date) => {
    if (!date) return null;
    const h = holidays.find((x) => x.startDate <= date && x.endDate >= date);
    if (h) return `a holiday (${h.name})`;
    const wk = DAY[new Date(`${date}T00:00:00Z`).getUTCDay()];
    return (school.weeklyOff || []).includes(wk) ? `a weekly off (${wk})` : null;
  };

  return (
    <CrudPage title="Exams" endpoint="/exams"
      fields={[
        { name: 'name', label: 'Exam name (e.g. Mid-term)', required: true },
        { name: 'class', label: 'Class', type: 'select', required: true, optionsFrom: '/classes', optionLabel: (c) => `${c.name} ${c.section}` },
        { name: 'subject', label: 'Subject', type: 'select', required: true, optionsFrom: '/subjects', optionLabel: (s) => s.name },
        { name: 'date', label: 'Exam date', type: 'date', required: true, warn: (v) => (why(v) ? `${v} is ${why(v)}. You can still schedule the exam.` : null) },
        { name: 'maxMarks', label: 'Maximum marks', type: 'number', required: true },
      ]}
      columns={[
        { label: 'Exam', render: (r) => r.name },
        { label: 'Class', render: (r) => `${r.class.name} ${r.class.section}` },
        { label: 'Subject', render: (r) => r.subject.name },
        { label: 'Date', render: (r) => <>{r.date}{why(r.date) && <> <span className="badge late" title={`This date is ${why(r.date)}`}>Off day</span></>}</> },
        { label: 'Max', render: (r) => r.maxMarks },
        { label: 'Paper', render: (r) => (r.paper?.url ? <a href={r.paper.url} target="_blank" rel="noreferrer">View paper</a> : 'Not uploaded') },
      ]} />
  );
}
