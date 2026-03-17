import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { groupAPI, deviceAPI, locationAPI, userAPI } from '../services/api';
import { useAuth } from '../context/useAuth';

const EMPTY_GROUP = { name: '', description: '' };

export default function Groups() {
  const { isAdmin } = useAuth();
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [groupModal, setGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState(EMPTY_GROUP);

  const [memberModal, setMemberModal] = useState(null); // group object
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  const [deviceModal, setDeviceModal] = useState(null); // group object
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);

  const [activeGroup, setActiveGroup] = useState(null); // expanded detail panel

  const fetchAll = async () => {
    try {
      const [grpRes, usrRes, devRes, locRes] = await Promise.all([
        groupAPI.getAll(),
        isAdmin ? userAPI.getAll() : Promise.resolve({ data: { data: [] } }),
        deviceAPI.getAll(),
        locationAPI.getAll(),
      ]);
      setGroups(grpRes.data.data);
      setAllUsers(usrRes.data.data);
      setAllDevices(devRes.data.data);
      setAllLocations(locRes.data.data);
    } catch {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Group CRUD
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await groupAPI.update(editingGroup._id, groupForm);
        toast.success('Group updated');
      } else {
        await groupAPI.create(groupForm);
        toast.success('Group created');
      }
      setGroupModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save group');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Deactivate this group?')) return;
    try {
      await groupAPI.delete(id);
      toast.success('Group deactivated');
      fetchAll();
    } catch { toast.error('Failed to deactivate group'); }
  };

  // Members
  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await groupAPI.addMember(memberModal._id, { userId: memberUserId, role: memberRole });
      toast.success('Member added');
      setMemberUserId(''); setMemberRole('member');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (groupId, userId, userName) => {
    if (!window.confirm(`Remove ${userName} from this group?`)) return;
    try {
      await groupAPI.removeMember(groupId, userId);
      toast.success('Member removed');
      fetchAll();
    } catch { toast.error('Failed to remove member'); }
  };

  const handleRoleChange = async (groupId, userId, role) => {
    try {
      await groupAPI.updateMemberRole(groupId, userId, { role });
      toast.success('Role updated');
      fetchAll();
    } catch { toast.error('Failed to update role'); }
  };

  // Device assignment
  const openDeviceModal = (group) => {
    setDeviceModal(group);
    setSelectedDevices(group.devices.map((d) => (d._id || d)));
    setSelectedLocations(group.locations.map((l) => (l._id || l)));
  };

  const toggleDevice = (id) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleLocation = (id) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSaveDevices = async () => {
    try {
      await groupAPI.assignDevices(deviceModal._id, { deviceIds: selectedDevices });
      // Also update locations via update group
      await groupAPI.update(deviceModal._id, { locations: selectedLocations });
      toast.success('Devices & locations assigned');
      setDeviceModal(null);
      fetchAll();
    } catch { toast.error('Failed to assign devices'); }
  };

  const roleColors = {
    custodian: 'bg-amber-100 text-amber-700',
    member: 'bg-blue-100 text-blue-700',
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean-600" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{groups.length} group(s)</p>
        {isAdmin && (
          <button onClick={() => { setEditingGroup(null); setGroupForm(EMPTY_GROUP); setGroupModal(true); }} className="btn-primary">
            + New Group
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500 font-medium">No groups yet.</p>
          {isAdmin && <p className="text-gray-400 text-sm mt-1">Create a group and assign members and devices to it.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group._id} className="card">
              {/* Group header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-gray-800 text-lg">{group.name}</h3>
                    <span className="badge-active">Active</span>
                    <span className="text-xs text-gray-400">{group.members?.length || 0} members · {group.devices?.length || 0} devices</span>
                  </div>
                  {group.description && <p className="text-gray-500 text-sm mt-1">{group.description}</p>}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setActiveGroup(activeGroup?._id === group._id ? null : group)}
                    className="text-sm text-ocean-600 hover:underline font-medium"
                  >
                    {activeGroup?._id === group._id ? 'Collapse' : 'Details'}
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => { setEditingGroup(group); setGroupForm({ name: group.name, description: group.description || '' }); setGroupModal(true); }} className="btn-secondary text-sm py-1 px-3">Edit</button>
                      <button onClick={() => openDeviceModal(group)} className="btn-secondary text-sm py-1 px-3">📡 Devices</button>
                      <button onClick={() => { setMemberModal(group); }} className="btn-secondary text-sm py-1 px-3">👥 Members</button>
                      <button onClick={() => handleDeleteGroup(group._id)} className="btn-danger text-sm py-1 px-3">Deactivate</button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {activeGroup?._id === group._id && (
                <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Members */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Members</p>
                    {group.members?.length === 0 ? (
                      <p className="text-gray-400 text-sm">No members assigned.</p>
                    ) : (
                      <div className="space-y-2">
                        {group.members?.map((m) => (
                          <div key={m.user?._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-700 flex items-center justify-center text-sm font-semibold">
                                {m.user?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{m.user?.name}</p>
                                <p className="text-xs text-gray-400">{m.user?.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAdmin ? (
                                <select
                                  className="text-xs border border-gray-200 rounded px-2 py-1"
                                  value={m.role}
                                  onChange={(e) => handleRoleChange(group._id, m.user._id, e.target.value)}
                                >
                                  <option value="member">Member</option>
                                  <option value="custodian">Custodian</option>
                                </select>
                              ) : (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role]}`}>{m.role}</span>
                              )}
                              {isAdmin && (
                                <button onClick={() => handleRemoveMember(group._id, m.user._id, m.user.name)} className="text-xs text-red-500 hover:underline">Remove</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Devices */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Assigned Devices</p>
                    {group.devices?.length === 0 ? (
                      <p className="text-gray-400 text-sm">No devices assigned.</p>
                    ) : (
                      <div className="space-y-2">
                        {group.devices?.map((d) => (
                          <div key={d._id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <span>{d.type === 'fish_cage' ? '🐟' : '🌿'}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{d.name}</p>
                              <p className="text-xs text-gray-400">{d.deviceId}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{d.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create/Edit Group Modal ── */}
      {groupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4">{editingGroup ? 'Edit Group' : 'New Group'}</h3>
            <form onSubmit={handleSaveGroup} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input className="input" placeholder="e.g. North Beach Fish Farmers" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea className="input" rows={3} placeholder="What is this group for?" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setGroupModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Member Modal ── */}
      {memberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-1">Manage Members</h3>
            <p className="text-sm text-gray-500 mb-5">Group: <strong>{memberModal.name}</strong></p>

            <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
              <select className="input flex-1" value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)} required>
                <option value="">Select a user to add...</option>
                {allUsers
                  .filter((u) => !memberModal.members?.some((m) => m.user?._id === u._id))
                  .map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
              </select>
              <select className="input w-36" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="custodian">Custodian</option>
              </select>
              <button type="submit" className="btn-primary px-4">Add</button>
            </form>

            <p className="text-sm font-medium text-gray-700 mb-3">Current Members ({memberModal.members?.length || 0})</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {memberModal.members?.length === 0 ? (
                <p className="text-gray-400 text-sm">No members yet.</p>
              ) : memberModal.members?.map((m) => (
                <div key={m.user?._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.user?.name}</p>
                    <p className="text-xs text-gray-400">{m.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role]}`}>{m.role}</span>
                    <button onClick={() => handleRemoveMember(memberModal._id, m.user._id, m.user.name)} className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-secondary w-full mt-4" onClick={() => { setMemberModal(null); fetchAll(); }}>Close</button>
          </div>
        </div>
      )}

      {/* ── Assign Devices Modal ── */}
      {deviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-1">Assign Devices & Locations</h3>
            <p className="text-sm text-gray-500 mb-5">Group: <strong>{deviceModal.name}</strong></p>

            <p className="text-sm font-semibold text-gray-700 mb-2">Devices</p>
            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {allDevices.length === 0 ? (
                <p className="text-gray-400 text-sm">No devices registered yet.</p>
              ) : allDevices.map((d) => (
                <label key={d._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                    checked={selectedDevices.includes(d._id)}
                    onChange={() => toggleDevice(d._id)}
                  />
                  <span>{d.type === 'fish_cage' ? '🐟' : '🌿'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.deviceId} · {d.location?.name}</p>
                  </div>
                  <span className={`text-xs ${d.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>{d.status}</span>
                </label>
              ))}
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-2">Locations</p>
            <div className="space-y-2 mb-5 max-h-40 overflow-y-auto">
              {allLocations.map((l) => (
                <label key={l._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                    checked={selectedLocations.includes(l._id)}
                    onChange={() => toggleLocation(l._id)}
                  />
                  <span>{l.type === 'fish_cage' ? '🐟' : '🌿'}</span>
                  <p className="text-sm font-medium text-gray-800">{l.name}</p>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={handleSaveDevices}>Save Assignment</button>
              <button className="btn-secondary flex-1" onClick={() => setDeviceModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
