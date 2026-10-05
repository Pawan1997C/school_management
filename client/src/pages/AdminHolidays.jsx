import CrudPage from '../components/CrudPage.jsx';

const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1;

export default function AdminHolidays() {
  return (
    <CrudPage title="Holidays" endpoint="/holidays"
      fields={[
        { name: 'name', label: 'Holiday name', required: true },
        { name: 'startDate', label: 'From', type: 'date', required: true },
        { name: 'endDate', label: 'To (leave empty for one day)', type: 'date' },
      ]}
      columns={[
        { label: 'Holiday', render: (r) => r.name },
        { label: 'From', render: (r) => r.startDate },
        { label: 'To', render: (r) => r.endDate },
        { label: 'Days', render: (r) => days(r.startDate, r.endDate) },
      ]} />
  );
}
