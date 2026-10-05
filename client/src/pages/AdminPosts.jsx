import CrudPage from '../components/CrudPage.jsx';

export default function AdminPosts() {
  return (
    <CrudPage title="News and events" endpoint="/posts"
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'news', label: 'News' }, { value: 'event', label: 'Event' }] },
        { name: 'date', label: 'Date (event date or publish date)', type: 'date', required: true },
        { name: 'body', label: 'Details', type: 'textarea', maxLength: 3000 },
        { name: 'image', label: 'Image (optional, max 5 MB)', type: 'file' },
      ]}
      columns={[
        { label: 'Image', render: (r) => (r.image?.url ? <img className="thumb" src={r.image.url} alt="" /> : '–') },
        { label: 'Title', render: (r) => r.title },
        { label: 'Type', render: (r) => <span className={`badge ${r.type === 'event' ? 'leave' : 'holiday'}`}>{r.type}</span> },
        { label: 'Date', render: (r) => r.date },
      ]} />
  );
}
