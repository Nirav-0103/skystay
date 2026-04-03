import { useState, useRef } from 'react';
import { hotelAPI, uploadAPI } from '../../utils/api';
import { FiX, FiUpload, FiLink, FiImage, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  fontSize: '0.88rem',
  outline: 'none',
  color: 'var(--text-primary)',
  background: 'var(--bg-card)',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  marginTop: 5,
};

const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' };

function ImageUploadField({ images = [], onChange }) {
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // 5MB limit and image type check
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is over 5MB ❌`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image ❌`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const results = await Promise.all(
        validFiles.map(file =>
          uploadAPI.hotelImage(file).then(r => r.data.url || r.data.imageUrl)
        )
      );
      const validUrls = results.filter(Boolean);
      onChange([...images, ...validUrls]);
      toast.success(`${validUrls.length} image(s) uploaded! ✅`);
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }
    if (images.includes(url)) {
      toast.error('This URL is already added');
      return;
    }
    onChange([...images, url]);
    setUrlInput('');
  };

  const handleRemove = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            border: '1.5px dashed var(--border)',
            background: uploading ? 'var(--bg-secondary)' : 'var(--bg-card)',
            color: 'var(--text-secondary)',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem', fontWeight: 500, flex: 1,
          }}
        >
          <FiUpload size={13} />
          {uploading ? 'Uploading…' : 'Upload from Device'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="url"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
          placeholder="https://example.com/image.jpg"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1.5px solid var(--border)', fontSize: '0.82rem',
            outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-card)',
          }}
        />
        <button
          type="button"
          onClick={handleAddUrl}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 14px', borderRadius: 8,
            border: '1.5px solid var(--border)', background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 500,
          }}
        >
          <FiLink size={13} /> Add URL
        </button>
      </div>

      {images.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {images.map((img, i) => (
            <div
              key={i}
              style={{
                position: 'relative', width: 70, height: 52,
                borderRadius: 8, overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <img
                src={img}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.parentNode.style.background = 'var(--bg-secondary)';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', border: 'none',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <FiX size={10} />
              </button>
              {i === 0 && (
                <span style={{
                  position: 'absolute', bottom: 2, left: 2,
                  background: 'rgba(0,0,0,0.6)', color: 'white',
                  fontSize: '0.55rem', padding: '1px 5px',
                  borderRadius: 4, fontWeight: 600,
                }}>
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '20px', borderRadius: 8,
          border: '1.5px dashed var(--border)',
          textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem',
          background: 'var(--bg-secondary)'
        }}>
          <FiImage size={20} style={{ marginBottom: 6, opacity: 0.5, display: 'block', margin: '0 auto 6px' }} />
          <div>No images added yet</div>
        </div>
      )}
    </div>
  );
}

export default function HotelFormModal({ hotel, onClose, onSave }) {
  const [form, setForm] = useState({
    name:          hotel?.name          || '',
    city:          hotel?.city          || '',
    location:      hotel?.location      || '',
    address:       hotel?.address       || '',
    description:   hotel?.description   || '',
    category:      hotel?.category      || 'standard',
    pricePerNight: hotel?.pricePerNight || '',
    rating:        hotel?.rating        || '',
    amenities:     hotel?.amenities?.join(', ') || '',
    images:        hotel?.images        || [],
    featured:      hotel?.featured      || false,
    isActive:      hotel?.isActive !== false,
  });

  const [saving, setSaving] = useState(false);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())    return toast.error('Hotel name is required');
    if (!form.city.trim())    return toast.error('City is required');
    if (!form.address.trim()) return toast.error('Address is required');
    if (!form.description.trim()) return toast.error('Description is required');
    if (!form.pricePerNight)  return toast.error('Price per night is required');

    setSaving(true);
    try {
      const payload = {
        ...form,
        location:      form.location || form.city,
        pricePerNight: Number(form.pricePerNight),
        rating:        form.rating ? Number(form.rating) : undefined,
        amenities:     form.amenities.split(',').map(a => a.trim()).filter(Boolean),
      };

      if (hotel?._id) {
        await hotelAPI.update(hotel._id, payload);
        toast.success('Hotel updated successfully!');
      } else {
        await hotelAPI.create(payload);
        toast.success('Hotel created successfully!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hotel');
    }
    setSaving(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: 18,
        width: '100%', maxWidth: 580,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        animation: 'modalIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--bg-card)',
          borderRadius: '18px 18px 0 0', zIndex: 1,
        }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
            {hotel ? '✏️ Edit Hotel' : '🏨 Add New Hotel'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: 'none', background: 'var(--bg-secondary)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            }}
          >
            <FiX size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 28px' }}>
          <form onSubmit={handleSubmit}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Hotel Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  style={inputStyle} type="text" required
                  placeholder="e.g. Taj Mahal Palace"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>City <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  style={inputStyle} type="text" required
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Category <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  style={inputStyle}
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                >
                  <option value="budget">Budget</option>
                  <option value="standard">Standard</option>
                  <option value="luxury">Luxury</option>
                  <option value="boutique">Boutique</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Full Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  style={inputStyle} type="text" required
                  placeholder="e.g. Apollo Bunder, Colaba, Mumbai 400001"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Price / Night (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  style={inputStyle} type="number" required min="0"
                  placeholder="e.g. 5000"
                  value={form.pricePerNight}
                  onChange={e => set('pricePerNight', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Rating (1–5)</label>
                <input
                  style={inputStyle} type="number"
                  min="1" max="5" step="0.1"
                  placeholder="e.g. 4.5"
                  value={form.rating}
                  onChange={e => set('rating', e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Description <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                style={{ ...inputStyle, height: 75, resize: 'vertical' }}
                placeholder="Describe the hotel..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>
                Amenities{' '}
                <span style={{ color: '#9ca3af', fontWeight: 400 }}>(comma-separated)</span>
              </label>
              <input
                style={inputStyle} type="text"
                placeholder="WiFi, Pool, Gym, Spa, Restaurant..."
                value={form.amenities}
                onChange={e => set('amenities', e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>
                Images{' '}
                <span style={{ color: '#9ca3af', fontWeight: 400 }}>
                  (upload from device or paste URL)
                </span>
              </label>
              <ImageUploadField
                images={form.images}
                onChange={imgs => set('images', imgs)}
              />
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                Active (visible to users)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={e => set('featured', e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: 'var(--gold)', cursor: 'pointer' }}
                />
                Featured (show on homepage)
              </label>
            </div>

            {form.images.length === 0 && (
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px',
                fontSize: '0.78rem', color: 'var(--text-secondary)',
                marginBottom: 14,
                display: 'flex', gap: 7, alignItems: 'flex-start',
              }}>
                <FiAlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                No images added. Hotel will show a placeholder on the listing page.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '10px', borderRadius: 9,
                  border: '1.5px solid var(--border)', background: 'var(--bg-card)',
                  color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 2, padding: '10px', borderRadius: 9,
                  border: 'none', background: saving ? 'var(--text-muted)' : 'var(--primary)',
                  color: 'white', fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.88rem',
                }}
              >
                {saving ? 'Saving…' : hotel ? 'Update Hotel' : 'Create Hotel'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}