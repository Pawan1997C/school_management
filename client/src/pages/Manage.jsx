import CrudPage from '../components/CrudPage.jsx';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';

const Photo = ({ p, name }) => <Avatar name={name} url={p?.url} />;
const clsLabel = (c) => `${c.name} ${c.section}`;

export const Classes = () => (
  <CrudPage title="Classes" endpoint="/classes"
    fields={[{ name: 'name', label: 'Class name (e.g. Grade 8)', required: true }, { name: 'section', label: 'Section', required: true }]}
    columns={[{ label: 'Class', render: (r) => r.name }, { label: 'Section', render: (r) => r.section }]} />
);

export const Subjects = () => (
  <CrudPage title="Subjects" endpoint="/subjects"
    fields={[{ name: 'name', label: 'Subject name', required: true }, { name: 'code', label: 'Code (e.g. MATH8)', required: true }]}
    columns={[{ label: 'Subject', render: (r) => r.name }, { label: 'Code', render: (r) => r.code }]} />
);

export const Teachers = () => (
  <CrudPage title="Teachers" endpoint="/teachers"
    fields={[
      { name: 'name', label: 'Full name', required: true },
      { name: 'email', label: 'Login email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'employeeId', label: 'Employee ID' },
      { name: 'designation', label: 'Designation (shown on website)' },
      { name: 'qualification', label: 'Qualification (shown on website)' },
      { name: 'bio', label: 'Short bio (shown on website)', type: 'textarea', maxLength: 400 },
      { name: 'showOnWebsite', label: 'Faculty page', type: 'checkbox', default: true, checkLabel: 'Show this teacher on the school website' },
      { name: 'subjects', label: 'Subjects taught', type: 'multiselect', optionsFrom: '/subjects', optionLabel: (s) => s.name },
      { name: 'photo', label: 'Photo', type: 'file' },
    ]}
    columns={[
      { label: 'Photo', render: (r) => <Photo p={r.photo} name={r.name} /> },
      { label: 'Name', render: (r) => r.name },
      { label: 'Email', render: (r) => r.email },
      { label: 'Phone', render: (r) => r.phone || '–' },
      { label: 'Subjects', render: (r) => r.subjects.map((s) => s.name).join(', ') || '–' },
    ]} />
);

export const Students = () => (
  <CrudPage title="Students" endpoint="/students" server
    filter={{ name: 'classId', all: 'All classes', optionsFrom: '/classes', optionLabel: clsLabel }}
    extraActions={(r) => <Link className="btn ghost sm" to={`/admin/students/${r._id}`}>ID card</Link>}
    fields={[
      { name: 'name', label: 'Full name', required: true },
      { name: 'rollNo', label: 'Roll number', required: true },
      { name: 'class', label: 'Class', type: 'select', required: true, optionsFrom: '/classes', optionLabel: clsLabel },
      { name: 'guardianName', label: 'Guardian name' },
      { name: 'guardianPhone', label: 'Guardian phone', type: 'tel' },
      { name: 'photo', label: 'Photo', type: 'file' },
    ]}
    columns={[
      { label: 'Photo', render: (r) => <Photo p={r.photo} name={r.name} /> },
      { label: 'Name', render: (r) => <Link to={`/admin/students/${r._id}`}>{r.name}</Link> },
      { label: 'Roll no.', render: (r) => r.rollNo },
      { label: 'Class', render: (r) => (r.class ? clsLabel(r.class) : '–') },
      { label: 'Guardian', render: (r) => [r.guardianName, r.guardianPhone].filter(Boolean).join(' · ') || '–' },
    ]} />
);
