import { useState, useEffect } from 'react';
import { eventsApi, Event } from '../api/api';
import './Dashboard.css';

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsApi.getAll();
      setEvents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await eventsApi.create(formData);
      setFormData({ title: '', startTime: '', endTime: '' });
      setShowForm(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventsApi.delete(id);
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleToggleSwappable = async (event: Event) => {
    const newStatus = event.status === 'SWAPPABLE' ? 'BUSY' : 'SWAPPABLE';
    try {
      await eventsApi.update(event.id, { status: newStatus });
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Events</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Create Event'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="event-form">
          <h2>Create New Event</h2>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Create</button>
        </form>
      )}

      <div className="events-list">
        {events.length === 0 ? (
          <p className="empty-state">No events yet. Create your first event!</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <h3>{event.title}</h3>
                <span className={`status-badge status-${event.status.toLowerCase()}`}>
                  {event.status}
                </span>
              </div>
              <div className="event-details">
                <p><strong>Start:</strong> {formatDate(event.startTime)}</p>
                <p><strong>End:</strong> {formatDate(event.endTime)}</p>
              </div>
              <div className="event-actions">
                <button
                  onClick={() => handleToggleSwappable(event)}
                  className={`btn-toggle ${event.status === 'SWAPPABLE' ? 'active' : ''}`}
                  disabled={event.status === 'SWAP_PENDING'}
                >
                  {event.status === 'SWAPPABLE' ? 'Mark as Busy' : 'Make Swappable'}
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="btn-danger"
                  disabled={event.status === 'SWAP_PENDING'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

