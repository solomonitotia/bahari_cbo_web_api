import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { postAPI } from '../services/api';

const EMPTY = { title: '', excerpt: '', content: '', coverImage: '', category: 'news', tags: '', isPublished: false };

const CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'update', label: 'Update' },
  { value: 'guide', label: 'Guide' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'success_story', label: 'Success Story' },
];

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const fetchPosts = async () => {
    try {
      const res = await postAPI.getAllAdmin();
      setPosts(res.data.data);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (post) => {
    setEditing(post._id);
    setForm({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      category: post.category,
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      isPublished: post.isPublished,
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await postAPI.update(editing, payload);
        toast.success('Post updated');
      } else {
        await postAPI.create(payload);
        toast.success('Post created');
      }
      setModal(false);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (post) => {
    try {
      await postAPI.update(post._id, { isPublished: !post.isPublished });
      toast.success(post.isPublished ? 'Post unpublished' : 'Post published!');
      fetchPosts();
    } catch { toast.error('Failed to update post'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await postAPI.delete(id);
      toast.success('Post deleted');
      fetchPosts();
    } catch { toast.error('Failed to delete'); }
  };

  const catColors = {
    news: 'bg-blue-100 text-blue-700', update: 'bg-green-100 text-green-700',
    guide: 'bg-purple-100 text-purple-700', announcement: 'bg-orange-100 text-orange-700',
    success_story: 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{posts.length} post(s)</p>
        <button onClick={openCreate} className="btn-primary">+ New Post</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-500">No posts yet. Create your first post to share with the community!</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Title</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Category</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Views</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-800 max-w-xs truncate">{post.title}</p>
                    {post.excerpt && <p className="text-xs text-gray-400 truncate max-w-xs">{post.excerpt}</p>}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${catColors[post.category] || 'bg-gray-100 text-gray-600'}`}>
                      {CATEGORIES.find((c) => c.value === post.category)?.label || post.category}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={post.isPublished ? 'badge-active' : 'badge-inactive'}>
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-500">{post.views}</td>
                  <td className="py-3 px-3 text-xs text-gray-400">
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button onClick={() => setPreview(post)} className="text-xs text-gray-500 hover:underline">Preview</button>
                      <button onClick={() => openEdit(post)} className="text-xs text-ocean-600 hover:underline">Edit</button>
                      <button onClick={() => handleTogglePublish(post)} className={`text-xs hover:underline ${post.isPublished ? 'text-yellow-600' : 'text-green-600'}`}>
                        {post.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDelete(post._id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 text-lg mb-5">{editing ? 'Edit Post' : 'New Post'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input className="input" placeholder="E.g. Temperature Alert: North Cage Site" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input className="input" placeholder="https://..." value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Summary <span className="text-gray-400 font-normal">(shown in list view)</span></label>
                <textarea className="input" rows={2} placeholder="Briefly describe what this post is about..." value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} maxLength={300} />
                <p className="text-xs text-gray-400 mt-1">{form.excerpt.length}/300</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
                <textarea
                  className="input font-mono text-xs"
                  rows={10}
                  placeholder="Write your full post content here..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
                <input className="input" placeholder="fish cage, temperature, alert" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-ocean-600" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                <span className="text-sm text-gray-700">Publish immediately (visible on landing page)</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save Post'}</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${catColors[preview.category] || 'bg-gray-100 text-gray-600'}`}>
                {CATEGORIES.find((c) => c.value === preview.category)?.label}
              </span>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            {preview.coverImage && (
              <img src={preview.coverImage} alt={preview.title} className="w-full h-48 object-cover rounded-lg mb-4" />
            )}
            <h2 className="text-xl font-bold text-gray-800 mb-2">{preview.title}</h2>
            {preview.excerpt && <p className="text-gray-500 text-sm mb-4 italic">{preview.excerpt}</p>}
            <div className="prose prose-sm text-gray-700 whitespace-pre-line">{preview.content}</div>
            {preview.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {preview.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
