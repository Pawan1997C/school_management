import CrudPage from '../components/CrudPage.jsx';

export default function AdminGallery() {
  return (
    <CrudPage title="Gallery" endpoint="/gallery"
      fields={[
        { name: 'image', label: 'Photo (max 5 MB)', type: 'file', required: true },
        { name: 'caption', label: 'Caption' },
        { name: 'category', label: 'Album (e.g. Sports, Annual Day, Campus)' },
      ]}
      columns={[
        { label: 'Photo', render: (r) => <img className="thumb" src={r.image.url} alt="" /> },
        { label: 'Caption', render: (r) => r.caption || '–' },
        { label: 'Album', render: (r) => r.category || 'General' },
      ]} />
  );
}
