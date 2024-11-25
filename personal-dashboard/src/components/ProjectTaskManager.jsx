import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function ProjectTaskManager() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    }
  }, [selectedProject]);

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data);
    }
  }

  async function fetchTasks(projectId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data);
    }
  }

  async function handleUpdateProject(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('projects')
      .update({
        name: editingProject.name,
        description: editingProject.description
      })
      .eq('id', editingProject.id);

    if (error) {
      console.error('Error updating project:', error);
    } else {
      setEditingProject(null);
      fetchProjects();
    }
  }

  async function handleUpdateTask(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('tasks')
      .update({
        name: editingTask.name,
        description: editingTask.description
      })
      .eq('id', editingTask.id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      setEditingTask(null);
      fetchTasks(selectedProject);
    }
  }

  return (
    <div className="management-grid">
      {/* Manage Projects Card */}
      <div className="entry-card">
        <div className="card-header" onClick={() => setIsProjectsOpen(!isProjectsOpen)}>
          <h2>Manage Projects</h2>
          <button className="collapse-btn">
            {isProjectsOpen ? '▼' : '▶'}
          </button>
        </div>
        {isProjectsOpen && (
          <div className="projects-list">
            {projects.map(project => (
              <div key={project.id} className="list-item">
                {editingProject?.id === project.id ? (
                  <form onSubmit={handleUpdateProject} className="edit-form">
                    <div className="form-group">
                      <input
                        type="text"
                        value={editingProject.name}
                        onChange={(e) => setEditingProject({
                          ...editingProject,
                          name: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        value={editingProject.description}
                        onChange={(e) => setEditingProject({
                          ...editingProject,
                          description: e.target.value
                        })}
                      />
                    </div>
                    <div className="button-group">
                      <button type="submit" className="submit-btn">Save</button>
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => setEditingProject(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="list-item-content">
                    <div>
                      <h3>{project.name}</h3>
                      <p>{project.description}</p>
                    </div>
                    <div className="list-item-actions">
                      <button 
                        className="action-btn"
                        onClick={() => {
                          setSelectedProject(project.id);
                          setEditingProject(null);
                        }}
                      >
                        View Tasks
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => setEditingProject(project)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage Tasks Card */}
      {selectedProject && (
        <div className="entry-card">
          <div className="card-header" onClick={() => setIsTasksOpen(!isTasksOpen)}>
            <h2>Manage Tasks</h2>
            <button className="collapse-btn">
              {isTasksOpen ? '▼' : '▶'}
            </button>
          </div>
          {isTasksOpen && (
            <div className="tasks-list">
              {tasks.map(task => (
                <div key={task.id} className="list-item">
                  {editingTask?.id === task.id ? (
                    <form onSubmit={handleUpdateTask} className="edit-form">
                      <div className="form-group">
                        <input
                          type="text"
                          value={editingTask.name}
                          onChange={(e) => setEditingTask({
                            ...editingTask,
                            name: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <textarea
                          value={editingTask.description}
                          onChange={(e) => setEditingTask({
                            ...editingTask,
                            description: e.target.value
                          })}
                        />
                      </div>
                      <div className="button-group">
                        <button type="submit" className="submit-btn">Save</button>
                        <button 
                          type="button" 
                          className="cancel-btn"
                          onClick={() => setEditingTask(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="list-item-content">
                      <div>
                        <h3>{task.name}</h3>
                        <p>{task.description}</p>
                      </div>
                      <div className="list-item-actions">
                        <button 
                          className="action-btn"
                          onClick={() => setEditingTask(task)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectTaskManager;