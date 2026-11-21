import PreviewPanel from './PreviewPanel'

const FullPagePreview = ({ project }) => {
  return (
    <div className='h-dvh flex flex-col overflow-hidden'>
      <PreviewPanel files={project.files || {}} projectId={project._id} />
    </div>
  )
}

export default FullPagePreview
