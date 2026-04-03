import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';
import { postAPI, hotelAPI, uploadAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FiHeart, FiMessageSquare, FiShare2, FiMapPin, FiCamera, FiSend, FiUser, FiTrash2, FiPlus, FiX, FiBookmark } from 'react-icons/fi';

export default function SocialFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ content: '', location: '', hotelId: '', images: [] });
  const [hotels, setHotels] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchHotels();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await postAPI.getAll();
      setPosts(res.data.posts);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load feed');
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const res = await hotelAPI.getAll({ limit: 50 });
      setHotels(res.data.hotels);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please sign in to post');
    if (!newPost.content.trim() && newPost.images.length === 0) return toast.error('Please add some content or a photo');

    try {
      const res = await postAPI.create({
        content: newPost.content,
        location: newPost.location,
        hotel: newPost.hotelId || null,
        images: newPost.images
      });
      setPosts([res.data.post, ...posts]);
      setNewPost({ content: '', location: '', hotelId: '', images: [] });
      setShowCreate(false);
      toast.success('Posted successfully! ✨');
    } catch (err) {
      toast.error('Failed to create post');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Simple frontend check
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image size must be less than 5MB');

    setUploading(true);
    const loadingToast = toast.loading('Uploading photo...');
    try {
      const res = await uploadAPI.postImage(file);
      setNewPost({ ...newPost, images: [res.data.url] });
      toast.success('Photo added!', { id: loadingToast });
    } catch (err) {
      console.error('Frontend Upload Error Detail:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      });
      const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
      toast.error(`Error: ${errorMsg}`, { id: loadingToast });
    }
    setUploading(false);
  };

  const handleLike = async (postId) => {
    if (!user) return toast.error('Please sign in to like');
    try {
      await postAPI.toggleLike(postId);
      setPosts(posts.map(p => {
        if (p._id === postId) {
          const isLiked = p.likes.includes(user._id);
          const newLikes = isLiked 
            ? p.likes.filter(id => id !== user._id)
            : [...p.likes, user._id];
          return { ...p, likes: newLikes };
        }
        return p;
      }));
    } catch (err) {
      toast.error('Failed to update like');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postAPI.delete(postId);
      setPosts(posts.filter(p => p._id !== postId));
      toast.success('Post removed');
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  return (
    <>
      <Head>
        <title>Social Feed | SkyStay Community</title>
      </Head>
      <Navbar />

      <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 40, paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 700 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Syne' }}>SkyFeed</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Share your travel moments with the SkyStay community</p>
            </div>
            {user && (
              <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary share-btn" style={{ gap: 8 }}>
                {showCreate ? <FiX /> : <FiPlus />} <span className="share-text">{showCreate ? 'Cancel' : 'Share Moment'}</span>
              </button>
            )}
          </div>

          <style jsx>{`
            @media (max-width: 500px) {
              .share-btn {
                padding: 8px 12px !important;
              }
              .share-text {
                display: none;
              }
            }
          `}</style>

          {showCreate && user && (
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-md)', marginBottom: 32, animation: 'fadeInDown 0.3s ease' }}>
              <form onSubmit={handleCreatePost}>
                <textarea
                  placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
                  value={newPost.content}
                  onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  style={{ width: '100%', minHeight: 120, padding: 16, border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 16, outline: 'none', fontSize: '1rem', resize: 'none' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <FiMapPin style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      placeholder="Location"
                      value={newPost.location}
                      onChange={e => setNewPost({ ...newPost, location: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <FiBookmark style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select
                      value={newPost.hotelId}
                      onChange={e => setNewPost({ ...newPost, hotelId: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none', background: 'white' }}
                    >
                      <option value="">Tag a Hotel (Optional)</option>
                      {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="file"
                      id="post-image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="post-image" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      padding: '8px 16px', 
                      borderRadius: 'var(--radius-full)', 
                      background: 'var(--bg)', 
                      cursor: uploading ? 'not-allowed' : 'pointer', 
                      fontSize: '0.88rem', 
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)'
                    }}>
                      <FiCamera size={18} /> {uploading ? 'Uploading...' : 'Add Photo'}
                    </label>
                    {newPost.images.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <img src={newPost.images[0]} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                        <button 
                          onClick={() => setNewPost({ ...newPost, images: [] })}
                          style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={uploading} className="btn btn-primary" style={{ padding: '12px 32px' }}>
                    Post Moment
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
              <div className="loader" />
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🌍</div>
              <h3>No moments shared yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Be the first to share your journey!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {posts.map(post => (
                <div key={post._id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                        {post.user?.avatar ? <img src={post.user.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <FiUser size={20} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{post.user?.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <FiMapPin size={10} /> {post.location || (post.hotel ? `${post.hotel.name}, ${post.hotel.city}` : 'Somewhere nice')}
                        </div>
                      </div>
                    </div>
                    {user && (user._id === post.user?._id || user.role === 'admin') && (
                      <button onClick={() => handleDelete(post._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 8 }} title="Delete Post">
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div style={{ padding: '0 20px 20px', fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {post.content}
                  </div>

                  {post.images && post.images.length > 0 && (
                    <div style={{ width: '100%', aspectRatio: '16/9', background: '#f1f5f9' }}>
                      <img src={post.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Travel moment" />
                    </div>
                  )}

                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 24 }}>
                    <button 
                      onClick={() => handleLike(post._id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: post.likes.includes(user?._id) ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', padding: '6px 0' }}
                    >
                      <FiHeart fill={post.likes.includes(user?._id) ? 'var(--danger)' : 'none'} /> {post.likes.length}
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', padding: '6px 0' }}>
                      <FiMessageSquare /> {post.comments.length}
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', padding: '6px 0', marginLeft: 'auto' }}>
                      <FiShare2 /> Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
