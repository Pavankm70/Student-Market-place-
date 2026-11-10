import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import LocationPickerMap from '../components/LocationPickerMap';
import {
  CATEGORIES,
  CONDITIONS,
  DEFAULT_PLACEHOLDER_IMAGE,
  getCategoryPlaceholder,
  sanitizeImageUrl,
  PRESET_IMAGES,
} from '../utils/constants';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  IndianRupee,
  MapPin,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Tag,
  Loader2,
} from 'lucide-react';

const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'BOOKS',
    imageUrl: '',
    conditionType: 'Good',
    isbn: '',
    author: '',
    pickupLocation: '',
    latitude: 13.1287,
    longitude: 77.5874,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [notOwner, setNotOwner] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const data = await listingService.getListingById(id);
        // Check owner authorization on client
        if (user && data.sellerId && user.id !== data.sellerId) {
          setNotOwner(true);
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: data.price ? data.price.toString() : '',
          category: data.category || 'BOOKS',
          imageUrl: data.imageUrl || '',
          conditionType: data.conditionType || 'Good',
          isbn: data.isbn || '',
          author: data.author || '',
          pickupLocation: data.pickupLocation || '',
          latitude: data.latitude !== null && data.latitude !== undefined ? data.latitude : 13.1287,
          longitude: data.longitude !== null && data.longitude !== undefined ? data.longitude : 77.5874,
        });
      } catch (err) {
        console.error('Failed to load listing for editing:', err);
        setServerError('Listing not found or unable to load.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, user]);

  const validate = () => {
    const errs = {};
    if (!formData.title || !formData.title.trim()) {
      errs.title = 'Title is required';
    } else if (formData.title.trim().length > 150) {
      errs.title = 'Title must not exceed 150 characters';
    }

    if (!formData.description || !formData.description.trim()) {
      errs.description = 'Description is required';
    } else if (formData.description.trim().length > 3000) {
      errs.description = 'Description must not exceed 3000 characters';
    }

    if (!formData.price || formData.price.toString().trim() === '') {
      errs.price = 'Price is required (e.g. 450.00)';
    } else {
      const p = parseFloat(formData.price);
      if (isNaN(p) || p <= 0) {
        errs.price = 'Price must be greater than ₹0.00';
      }
    }

    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;

    if (!isValid) {
      const firstField = Object.keys(errs)[0];
      setServerError(`Please fill in required fields: ${errs[firstField]}`);
      const el = document.getElementById(firstField);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }

    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalVal = value;
    if (name === 'imageUrl') {
      finalVal = sanitizeImageUrl(value);
      setImageLoadError(false);
      setImagePreviewUrl('');
    }
    setFormData((prev) => ({ ...prev, [name]: finalVal }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = '';
    const previewObjUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewObjUrl);
    setImageLoadError(false);

    setUploadingImage(true);
    setServerError(null);

    try {
      const url = await listingService.uploadImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.warn('Backend image upload failed, falling back to embedded Data URL:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        imageUrl: formData.imageUrl ? formData.imageUrl.trim() : null,
        conditionType: formData.conditionType,
        isbn: formData.category === 'BOOKS' ? formData.isbn.trim() : null,
        author: formData.category === 'BOOKS' ? formData.author.trim() : null,
        pickupLocation: formData.pickupLocation ? formData.pickupLocation.trim() : null,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      await listingService.updateListing(id, payload);
      toast.success('Listing updated successfully!');
      navigate(`/listings/${id}`);
    } catch (err) {
      console.error('Failed to update listing:', err);
      if (err.response?.status === 403) {
        setServerError('Permission denied: You can only edit your own listings.');
      } else if (err.response?.status === 401) {
        setServerError('Session expired. Please log in again.');
      } else if (err.response?.data?.validationErrors) {
        setErrors(err.response.data.validationErrors);
        setServerError('Please fix the validation errors below.');
      } else if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else if (!err.response) {
        setServerError('Cannot reach backend server. Please check your network connection.');
      } else {
        setServerError('Failed to update listing.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading listing details for editing..." />;
  }

  if (notOwner) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }}>
        <EmptyState
          title="Access Restricted"
          message="You are not authorized to edit this listing because you are not the original owner."
          actionText="Back to Marketplace"
          actionLink="/browse"
        />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: '3.5rem 0 5rem 0', minHeight: '85vh', backgroundColor: 'var(--warm-white)' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.75rem' }}>
          <Link
            to={`/listings/${id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--charcoal)',
              fontWeight: 600,
              fontSize: '0.925rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--sage-light)',
              border: '1px solid var(--border-subtle)',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={16} /> Back to Listing #{id}
          </Link>
        </div>

        {/* Header Title Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--charcoal)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              <ShieldCheck size={14} /> Verified Seller #{user?.sellerId || user?.id || '—'}
            </span>
            <span
              style={{
                backgroundColor: 'var(--sage-light)',
                color: 'var(--charcoal)',
                fontWeight: 600,
                fontSize: '0.78rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Editing Item #{id}
            </span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--charcoal)', margin: '0 0 0.5rem 0', lineHeight: 1.15 }}>
            Edit Campus Listing
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0, lineHeight: 1.5 }}>
            Make adjustments to your item title, pricing, condition, description, photos, or campus pickup spot.
          </p>
        </div>

        {/* Server Alert Message */}
        {serverError && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem 1.5rem',
              color: '#b91c1c',
              fontSize: '0.925rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              marginBottom: '2rem',
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>Update Issue</div>
              <div>{serverError}</div>
            </div>
          </div>
        )}

        {/* Main Edit Form Card */}
        <div
          className="card"
          style={{
            padding: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: '#ffffff',
            boxShadow: 'var(--shadow-xs)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Category Selection */}
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" htmlFor="category" style={{ fontWeight: 700, color: 'var(--charcoal)' }}>
                Listing Category <span className="req">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
                style={{ height: '48px', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem' }}
                required
              >
                {CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Title */}
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" htmlFor="title" style={{ fontWeight: 700, color: 'var(--charcoal)' }}>
                Item Title <span className="req">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`form-input ${errors.title ? 'has-error' : ''}`}
                style={{ height: '48px', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem' }}
                placeholder="e.g., Engineering Mathematics 4th Edition, TI-84 Plus, Drafter"
                maxLength={150}
                required
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            {/* Price & Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="price" style={{ fontWeight: 700, color: 'var(--charcoal)' }}>
                  Asking Price (₹ INR) <span className="req">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee
                    size={18}
                    color="var(--muted-green)"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="number"
                    id="price"
                    name="price"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="450.00"
                    className={`form-input ${errors.price ? 'has-error' : ''}`}
                    style={{ height: '48px', borderRadius: 'var(--radius-sm)', paddingLeft: '40px', fontSize: '0.95rem', fontWeight: 600 }}
                    required
                  />
                </div>
                {errors.price && <div className="form-error">{errors.price}</div>}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="conditionType" style={{ fontWeight: 700, color: 'var(--charcoal)' }}>
                  Condition
                </label>
                <select
                  id="conditionType"
                  name="conditionType"
                  value={formData.conditionType}
                  onChange={handleChange}
                  className="form-select"
                  style={{ height: '48px', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem' }}
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional ISBN & Author if Category is Books */}
            {formData.category === 'BOOKS' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--sage-light)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.75rem',
                }}
              >
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="author" style={{ fontWeight: 600, color: 'var(--charcoal)' }}>
                    Author / Creator
                  </label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    placeholder="e.g. Thomas H. Cormen"
                    className="form-input"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="isbn" style={{ fontWeight: 600, color: 'var(--charcoal)' }}>
                    ISBN (Optional)
                  </label>
                  <input
                    type="text"
                    id="isbn"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    placeholder="e.g. 9780262033848"
                    className="form-input"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" htmlFor="description" style={{ fontWeight: 700, color: 'var(--charcoal)' }}>
                Item Description <span className="req">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your item's condition, usage duration, semester notes included, accessories, or pickup availability..."
                className={`form-textarea ${errors.description ? 'has-error' : ''}`}
                style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', lineHeight: '1.6', padding: '1rem' }}
                maxLength={3000}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                {errors.description ? (
                  <div className="form-error">{errors.description}</div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Include highlights and any minor defects honestly.</span>
                )}
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formData.description.length}/3000</span>
              </div>
            </div>

            {/* Image Section */}
            <div
              className="form-group"
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                backgroundColor: 'var(--warm-white)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="form-label" htmlFor="imageUrl" style={{ margin: 0, fontWeight: 700, color: 'var(--charcoal)', fontSize: '0.95rem' }}>
                  Product Photo / Image Link
                </label>
                {(formData.imageUrl || imagePreviewUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, imageUrl: '' }));
                      setImagePreviewUrl('');
                      setImageLoadError(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-orange)',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Clear Photo
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                  <ImageIcon
                    size={18}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="Paste web photo URL (e.g. https://... or Google Books cover)"
                    className="form-input"
                    style={{ height: '46px', borderRadius: 'var(--radius-sm)', paddingLeft: '42px', fontSize: '0.925rem', backgroundColor: '#ffffff' }}
                  />
                </div>

                <label
                  className="btn btn-outline"
                  style={{
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--charcoal)',
                    backgroundColor: '#ffffff',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-pill)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0 1.25rem',
                    height: '46px',
                  }}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 size={16} className="spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> Choose File
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* Verified Preset Category Photos */}
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
                  Or apply a verified campus category photo:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {PRESET_IMAGES.map((preset, idx) => {
                    const isSelected = formData.imageUrl === preset.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, imageUrl: preset.url }));
                          setImagePreviewUrl('');
                          setImageLoadError(false);
                        }}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-pill)',
                          border: isSelected ? '1.5px solid var(--charcoal)' : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? 'var(--charcoal)' : '#ffffff',
                          color: isSelected ? '#ffffff' : 'var(--charcoal)',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 500,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Preview Indicator */}
              {(imagePreviewUrl || formData.imageUrl) && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: imageLoadError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
                    backgroundColor: imageLoadError ? 'rgba(239, 68, 68, 0.08)' : 'var(--sage-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <img
                    src={imagePreviewUrl || sanitizeImageUrl(formData.imageUrl)}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    style={{
                      width: '84px',
                      height: '84px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: '#ffffff',
                      flexShrink: 0,
                    }}
                    onLoad={() => setImageLoadError(false)}
                    onError={() => setImageLoadError(true)}
                  />
                  <div>
                    {!imageLoadError ? (
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle2 size={16} color="var(--muted-green)" /> Image loaded and verified
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          Your image will render crisp and sharp in student search feeds and details.
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <AlertCircle size={16} color="#dc2626" /> Unable to load this image URL
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '3px' }}>
                          External server blocked hotlinking. Please click <strong>Choose File</strong> to upload directly.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Campus Pickup Location & Interactive Map */}
            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--charcoal)', fontSize: '0.95rem', margin: 0 }}>
                  Campus Handover Location &amp; Map Pin
                </label>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Choose a safe campus landmark or click anywhere on the map to place your pickup coordinates.
                </p>
              </div>

              <LocationPickerMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                pickupLocation={formData.pickupLocation}
                onChange={({ latitude, longitude, pickupLocation }) => {
                  setFormData((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                    pickupLocation,
                  }));
                }}
              />
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <Link
                to={`/listings/${id}`}
                className="btn btn-outline btn-pill"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-pill"
                disabled={submitting || uploadingImage}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin" /> Updating Listing...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save &amp; Publish Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditListingPage;
