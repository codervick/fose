import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    fetchAlerts();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data.alerts);
    } catch (err) {
      console.error(err);
    }
  };

  const createEvent = async () => {
    if (!newEventTitle.trim()) return;
    setCreating(true);
    try {
      await api.post('/events', { title: newEventTitle });
      setNewEventTitle('');
      fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const getPendingCount = (event) => {
    return event.branches.reduce((acc, branch) => acc + branch.nodes.length, 0);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">FOSE</h1>
        <div className="flex items-center gap-4">
          {alerts.length > 0 && (
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {alerts.length} alerts
            </div>
          )}
          <span className="text-gray-400 text-sm">{user?.name}</span>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-red-400 mb-3">Pending Alerts</h2>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-red-300 text-sm">
                    Pending at <strong>{alert.pendingAt.name}</strong> — {alert.daysPending} day{alert.daysPending > 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-500 text-xs">{alert.node.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Event */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Create New Event</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createEvent()}
              className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              placeholder="Event title..."
            />
            <button
              onClick={createEvent}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* Events List */}
        <h2 className="text-lg font-semibold text-white mb-3">Active Events</h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-400">No events yet. Create your first event above.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 cursor-pointer hover:border-blue-500 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{event.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {event.parties.length} parties · {event.branches.length} branches
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getPendingCount(event) > 0 && (
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                        {getPendingCount(event)} pending
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}