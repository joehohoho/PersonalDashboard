function ProjectList({ refreshTrigger, onUpdate }) {
  // ... existing code ...

  const [project, setProject] = useState({
    name: '',
    description: '',
    status: 'open'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const projectData = {
      name: project.name,
      description: project.description,
      status: project.status
    };

    // ... existing submit logic ...
    
    if (!error) {
      onUpdate(); // Trigger refresh after successful update
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);
} 