import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import BuilderHeader from '../components/BuilderHeader';
import Loading from '../components/Loading';
import ChatPannel from '../components/ChatPannel';
import PriviewPannel from '../components/PriviewPannel';
import PublishDialog from '../components/PublishDialog';
import api from '../api/api';
import toast from 'react-hot-toast';
import { exportProjectZip } from '../utils/exportProject';

const BuilderPage = () => {

  const { id } = useParams();

  const navigate = useNavigate();

  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [publishedLink, setPublishedLink] = useState(null);
  const publishUrl = publishedLink?.id === id ? publishedLink.url : null;






  const { activeProject, loadingActiveProject, activeFile, showCode, setActiveFile, setShowCode, LoadProject: loadProject, logout, chatLoading, handleChat } = useAppContext();



  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    loadProject(id);

  }, [id, loadProject, navigate]);



  {/*// AppContext already polls projects while generation is in progress. */ }

  {/*// open function for the  */ }

  const handleOpenPreview = () => {
    if (!id) return;
    window.open(`/preview/${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer');
  }

  const handlePublish = async () => {
    if (!id || publishing) return;
    setPublishing(true);
    setPublishedLink(null);
    try {
      await api.post(`/api/projects/${encodeURIComponent(id)}/publish`);
      const url = `${window.location.origin}/publish/${encodeURIComponent(id)}`;
      setPublishedLink({ id, url });
      console.log('Published link:', url);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  }
  const handleDownLoad = async () => {
    if (exporting) return;
    if (!activeProject?.files || Object.keys(activeProject.files).length === 0) {
      toast.error('No code to export yet. Generate your project first.');
      return;
    }
    setExporting(true);
    try {
      await exportProjectZip(activeProject);
      toast.success('ZIP download started.');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export code. Please try again.');
    } finally {
      setExporting(false);
    }
  }




  if (loadingActiveProject || !activeProject) {
    return <Loading />
  }




  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden text-zinc-900 relative">
      {/*Top Bar Header */}

      <BuilderHeader
        projectName={activeProject.name}
        version={activeProject.version}
        showCode={showCode}
        publishing={publishing}
        exporting={exporting}
        onToggleShowCode={() => setShowCode(!showCode)}
        onOpenPreview={handleOpenPreview}
        onBack={() => navigate('/')}
        onLogout={logout}
        onPublish={handlePublish}
        onDownload={handleDownLoad}



      />



      {/* Main Layout */}

      {publishUrl && (
        <PublishDialog url={publishUrl} onClose={() => setPublishedLink(null)} />
      )}
      <PriviewPannel
        files={activeProject.files}
        projectId={activeProject._id}
        activeFile={activeFile}
        setActiveFile={setActiveFile}
        showCode={showCode}
      >
        <ChatPannel messages={activeProject.messages} onSend={handleChat} loading={chatLoading} />
      </PriviewPannel>


    </div>
  )
}

export default BuilderPage
