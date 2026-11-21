import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/api'
import Loading from '../components/Loading'
import PreviewPanel from '../components/PreviewPanel'

const PublishPage = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/projects/public/${encodeURIComponent(id)}`)
      .then(({ data }) => {
        if (!cancelled) setResult({ id, project: data.published ? data : null });
      })
      .catch(() => {
        if (!cancelled) setResult({ id, project: null });
      });
    return () => { cancelled = true; };
  }, [id]);

  if (!result || result.id !== id) return <Loading />;
  if (!result.project) return <p role="alert" className="p-8 text-center">Website unavailable or not published yet.</p>;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PreviewPanel files={result.project.files} projectId={id} />
    </div>
  )
}

export default PublishPage
