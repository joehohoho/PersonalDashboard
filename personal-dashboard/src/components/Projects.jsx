import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data);
    }
  }

  async function createProject(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select();

    if (error) {
      console.error('Error creating project:', error);
    } else {
      setProjects([...projects, data[0]]);
      setNewProject({ name: '', description: '' });
    }
  }

  return (
    <div className="dashboard">
      <div className="project-grid">
        <div className="project-card">
          <h2>Create New Project</h2>
          <form onSubmit={createProject} className="project-form">
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
            <button type="submit" className="submit-btn">Create Project</button>
          </form>
        </div>

        <div className="project-card">
          <h2>My Projects</h2>
          <div className="projects-list">
            {projects.map(project => (
              <div key={project.id} className="project-item">
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <div className="project-actions">
                  <button className="action-btn">View Tasks</button>
                  <button className="action-btn">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Projects; 