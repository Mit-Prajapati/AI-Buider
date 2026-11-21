import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/api'
import Loading from '../components/Loading'
import FullPagePreview from '../components/FullPagePreview'

const PreviewPage = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  useEffect(() => {
    let cancelled = false;
    api.get(`/api/projects/${encodeURIComponent(id)}`)
      .then(({ data }) => { if (!cancelled) setResult({ id, project: data }); })
      .catch(() => { if (!cancelled) setResult({ id, project: null }); });
    return () => { cancelled = true; };
  }, [id]);
  if (!result || result.id !== id) return <Loading />;
  if (!result.project) return <div className='p-8 text-center'><p role='alert'>Project preview is unavailable.</p><Link to='/' className='mt-4 inline-block underline'>Back to projects</Link></div>;
  return <FullPagePreview project={result.project} />;
}

export default PreviewPage
