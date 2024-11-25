function TaskList({ refreshTrigger, onUpdate }) {
  // ... existing code ...

  const handleSubmit = async (e) => {
    // ... existing submit logic ...
    
    if (!error) {
      onUpdate(); // Trigger refresh after successful update
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);
} 