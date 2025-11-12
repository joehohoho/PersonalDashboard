import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import '../styles/TaskNotes.css';

function TaskNotes({ taskId, taskName }) {
  const [notes, setNotes] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchNotes();
    } else {
      // Clear error when panel is closed
      setError(null);
    }
  }, [isOpen, taskId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('task_notes')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        // Check if it's a table doesn't exist error
        if (error.message && error.message.includes('does not exist')) {
          setError(`The task_notes table doesn't exist. Please run the migration script: add_pending_status_and_notes.sql`);
        } else {
          setError(`Error loading notes: ${error.message || 'Unknown error'}`);
        }
      } else {
        setNotes(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching notes:', err);
      setError(`Unexpected error: ${err.message || 'Unknown error'}`);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    const noteText = newNote.trim();
    if (!noteText) {
      console.log('Note is empty, not saving');
      return;
    }

    if (!taskId) {
      setError('Task ID is missing. Cannot save note.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Attempting to save note:', { taskId, note: noteText });
      const { data, error } = await supabase
        .from('task_notes')
        .insert([{
          task_id: taskId,
          note: noteText
        }])
        .select();

      if (error) {
        console.error('Error adding note:', error);
        if (error.message && error.message.includes('does not exist')) {
          setError(`The task_notes table doesn't exist. Please run the migration script: add_pending_status_and_notes.sql`);
        } else {
          setError(`Error adding note: ${error.message || 'Unknown error'}`);
        }
        setLoading(false);
      } else {
        console.log('Note saved successfully:', data);
        setNewNote('');
        setSuccessMessage('Note added successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchNotes();
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error adding note:', err);
      setError(`Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('task_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Error deleting note:', error);
        setError('Error deleting note');
      } else {
        await fetchNotes();
      }
    } catch (err) {
      console.error('Unexpected error deleting note:', err);
      setError('Unexpected error deleting note');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="task-notes">
      <button
        className="notes-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="View/Add Notes"
      >
        📝 Notes ({notes.length})
      </button>

      {isOpen && (
        <div className="notes-panel">
          <div className="notes-header">
            <h4>Notes for: {taskName}</h4>
            <button
              className="notes-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close notes"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="notes-error">
              ⚠️ {error}
            </div>
          )}

          {successMessage && (
            <div className="notes-success">
              ✅ {successMessage}
            </div>
          )}

          <form onSubmit={handleAddNote} className="notes-form">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note... (e.g., 'Contacted John on 12/15, awaiting response')"
              rows="3"
              className="notes-input"
              onKeyDown={(e) => {
                // Allow Ctrl+Enter or Cmd+Enter to submit
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (newNote.trim() && !loading) {
                    handleAddNote(e);
                  }
                }
              }}
            />
            <button
              type="submit"
              className="notes-submit-btn"
              disabled={loading || !newNote.trim()}
              onClick={(e) => {
                // Ensure form submission works
                if (!newNote.trim()) {
                  e.preventDefault();
                }
              }}
            >
              {loading ? 'Saving...' : '💾 Save Note'}
            </button>
          </form>

          <div className="notes-list">
            {notes.length === 0 ? (
              <div className="no-notes">No notes yet. Add one above to track updates!</div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="note-item">
                  <div className="note-content">{note.note}</div>
                  <div className="note-footer">
                    <span className="note-date">{formatDateTime(note.created_at)}</span>
                    <button
                      className="note-delete-btn"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskNotes;

