import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import FlowChart from '../flow/FlowChart';

export default function EventView() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAddParty, setShowAddParty] = useState(false);
  const [showAddNode, setShowAddNode] = useState(null);
  const [partyForm, setPartyForm] = useState({ name: '', email: '', type: 'EXTERNAL', role: 'PARTICIPANT' });
  const [nodeForm, setNodeForm] = useState({ title: '', type: 'EMAIL' });

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${eventId}`);
      setEvent(res.data.event);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const closeEvent = async () => {
    if (!confirm('Are you sure you want to close this event?')) return;
    try {
      await api.patch(`/events/${eventId}/close`);
      fetchEvent();
    } catch (err) {
      console.error(err);
    }
  };

  const addParty = async () => {
    try {
      await api.post(`/events/${eventId}/parties`, partyForm);
      setShowAddParty(false);
      setPartyForm({ name: '', email: '', type: 'EXTERNAL', role: 'PARTICIPANT' });
      fetchEvent();
    } catch (err) {
      console.error(err);
    }
  };

  const addNode = async (branchId) => {
    try {
      await api.post(`/events/${eventId}/branches/${branchId}/nodes`, nodeForm);
      setShowAddNode(null);
      setNodeForm({ title: '', type: 'EMAIL' });
      fetchEvent();
    } catch (err) {
      console.error(err);
    }
  };

  const updateNodeStatus = async (branchId, nodeId, status) => {
    try {
      await api.patch(`/events/${eventId}/branches/${branchId}/nodes/${nodeId}/status`, { status });
      fetchEvent();
      setSelectedNode(null);
    } catch (err) {
      console.error(err);
    }
  };

  const createSubBranch = async (branchId) => {
    const title = prompt('Enter sub-branch title:');
    if (!title) return;
    try {
      await api.post(`/events/${eventId}/branches/${branchId}/sub-branches`, { title });
      fetchEvent();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading event...</p>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Event not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition">
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-white">{event.title}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${
            event.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
          }`}>
            {event.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddParty(true)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            + Add Party
          </button>
          {event.status === 'ACTIVE' && (
            <button
              onClick={closeEvent}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Close Event
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Flowchart */}
        <div className="flex-1 relative">
          <FlowChart
            event={event}
            onNodeClick={setSelectedNode}
            onAddNode={(branchId) => setShowAddNode(branchId)}
            onAddSubBranch={createSubBranch}
          />
        </div>

        {/* Right — Side Panel */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          {selectedNode ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Node Detail</h2>
                <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Title</p>
                  <p className="text-white text-sm">{selectedNode.title}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Type</p>
                  <p className="text-white text-sm">{selectedNode.type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Status</p>
                  <p className={`text-sm font-medium ${
                    selectedNode.status === 'DONE' ? 'text-green-400' :
                    selectedNode.status === 'IN_PROGRESS' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{selectedNode.status}</p>
                </div>
                {selectedNode.notes && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Notes</p>
                    <p className="text-white text-sm">{selectedNode.notes}</p>
                  </div>
                )}
                <div className="pt-2 space-y-2">
                  <p className="text-gray-400 text-xs mb-2">Update Status</p>
                  {['PENDING', 'IN_PROGRESS', 'DONE'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateNodeStatus(selectedNode.branchId, selectedNode.id, status)}
                      className={`w-full py-2 rounded-lg text-sm transition ${
                        selectedNode.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <h2 className="text-white font-semibold mb-4">Parties</h2>
              <div className="space-y-2">
                {event.parties.map((party) => (
                  <div key={party.id} className="bg-gray-800 rounded-lg px-3 py-2">
                    <p className="text-white text-sm font-medium">{party.name}</p>
                    <p className="text-gray-400 text-xs">{party.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-blue-400">{party.role}</span>
                      <span className="text-xs text-gray-500">{party.type}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="text-white font-semibold mt-6 mb-4">Branches</h2>
              <div className="space-y-3">
                {event.branches.map((branch) => (
                  <div key={branch.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white text-sm font-medium">{branch.title}</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setShowAddNode(branch.id)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          + Node
                        </button>
                        <button
                          onClick={() => createSubBranch(branch.id)}
                          className="text-xs text-green-400 hover:text-green-300 ml-2"
                        >
                          + Branch
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {branch.nodes.map((node) => (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className="text-xs text-gray-400 hover:text-white cursor-pointer py-1 border-l-2 pl-2 border-gray-700 hover:border-blue-500 transition"
                        >
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            node.status === 'DONE' ? 'bg-green-400' :
                            node.status === 'IN_PROGRESS' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></span>
                          {node.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Party Modal */}
      {showAddParty && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold mb-4">Add Party</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={partyForm.name}
                onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={partyForm.email}
                onChange={(e) => setPartyForm({ ...partyForm, email: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              />
              <select
                value={partyForm.type}
                onChange={(e) => setPartyForm({ ...partyForm, type: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none"
              >
                <option value="EXTERNAL">External</option>
                <option value="INTERNAL">Internal</option>
              </select>
              <select
                value={partyForm.role}
                onChange={(e) => setPartyForm({ ...partyForm, role: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none"
              >
                <option value="PARTICIPANT">Participant</option>
                <option value="DECISION_MAKER">Decision Maker</option>
                <option value="DRIVER">Driver</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddParty(false)}
                className="flex-1 bg-gray-800 text-white py-3 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={addParty}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm"
              >
                Add Party
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Node Modal */}
      {showAddNode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold mb-4">Add Node</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Node title"
                value={nodeForm.title}
                onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              />
              <select
                value={nodeForm.type}
                onChange={(e) => setNodeForm({ ...nodeForm, type: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none"
              >
                <option value="EMAIL">Email</option>
                <option value="TASK">Task</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddNode(null)}
                className="flex-1 bg-gray-800 text-white py-3 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => addNode(showAddNode)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm"
              >
                Add Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}