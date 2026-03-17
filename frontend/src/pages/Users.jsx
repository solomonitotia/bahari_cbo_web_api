import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { userAPI } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (id, role) => {
    try {
      await userAPI.update(id, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await userAPI.update(id, { isActive: !isActive });
      toast.success(isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await userAPI.delete(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{users.length} user(s)</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">User</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Role</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Joined</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-700 flex items-center justify-center font-semibold text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{u.name} {u._id === currentUser._id && <span className="text-xs text-ocean-500">(you)</span>}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {u._id === currentUser._id ? (
                      <span className="badge-active capitalize">{u.role}</span>
                    ) : (
                      <select
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      >
                        <option value="monitor">Monitor</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className={u.isActive ? 'badge-active' : 'badge-inactive'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    {u._id !== currentUser._id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(u._id, u.isActive)}
                          className={`text-xs hover:underline ${u.isActive ? 'text-yellow-600' : 'text-green-600'}`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(u._id)} className="text-xs text-red-600 hover:underline">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
