import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { bookService } from '../services/bookService';
import BookLookupModal from '../components/BookLookupModal';
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
  PlusCircle,
  BookOpen,
  Image as ImageIcon,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Tag,
  MapPin,
  ShieldCheck,
  Search,
  Loader2,
  Check,
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CreateListingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    conditionType: 'Good',
    isbn: '',
    author: '',
    pickupLocation: 'NMIT Main Gate / Campus Library',
    latitude: 13.1287,
    longitude: 77.5874,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Image load & preview states
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  // Inline Google Books Search states
  const [bookQuery, setBookQuery] = useState('');
  const [searchingBook, setSearchingBook] = useState(false);
  const [bookResults, setBookResults] = useState([]);
  const [autofillSuccess, setAutofillSuccess] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.title || !formData.title.trim()) {
      errs.title = 'Product title is required';
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

    if (!formData.category) {
      errs.category = 'Please select a category';
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
    if (name === 'category' && value !== 'BOOKS') {
      setBookResults([]);
      setBookModalOpen(false);
      setSearchingBook(false);
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

  // Inline search directly from header
  const handleInlineBookSearch = async (e, queryToSearch) => {
    if (e && e.preventDefault) e.preventDefault();
    const q = (queryToSearch || bookQuery).trim();
    if (!q) return;

    setSearchingBook(true);
    setAutofillSuccess(null);
    try {
      const results = await bookService.searchBooks(q);
      setBookResults(results || []);
      if (!results || results.length === 0) {
        setServerError(`No Google Books matches found for "${q}". You can still fill in the details manually.`);
      }
    } catch (err) {
      console.error('Inline book search error:', err);
      setServerError('Unable to connect to Google Books API.');
    } finally {
      setSearchingBook(false);
    }
  };

  const handleSelectBook = (book) => {
    setFormData((prev) => ({
      ...prev,
      category: 'BOOKS',
      title: book.title || prev.title,
      author: book.author || prev.author,
      isbn: book.isbn || prev.isbn,
      description: book.description ? book.description.substring(0, 2000) : prev.description,
      imageUrl: sanitizeImageUrl(book.coverImageUrl) || prev.imageUrl,
    }));
    setImageLoadError(false);
    setImagePreviewUrl('');
    setBookResults([]);
    setAutofillSuccess(`Auto-filled: "${book.title}" by ${book.author || 'Author'}`);
    setTimeout(() => setAutofillSuccess(null), 5000);
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
        pickupLocation: formData.pickupLocation ? formData.pickupLocation.trim() : null,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      if (formData.category === 'BOOKS') {
        payload.isbn = formData.isbn ? formData.isbn.trim() : null;
        payload.author = formData.author ? formData.author.trim() : null;
      }

      const created = await listingService.createListing(payload);
      toast.success('Listing created successfully! Live on campus marketplace.');
      navigate(`/listings/${created.id}`);
    } catch (err) {
      console.error('Failed to create listing:', err);
      if (err.response?.status === 401) {
        setServerError('Your session has expired. Please log in again to publish.');
      } else if (err.response?.data?.validationErrors) {
        setErrors(err.response.data.validationErrors);
        setServerError('Please fix the validation errors below.');
      } else if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else if (!err.response) {
        setServerError('Cannot reach backend server. Please check your network connection.');
      } else {
        setServerError('Failed to create listing. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter" style={{ padding: '3.5rem 0 5rem 0', minHeight: '85vh', backgroundColor: 'var(--warm-white)' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: 'var(--charcoal)', color: '#ffffff', fontWeight: 700, fontSize: '0.78rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)' }}>
              Publishing as Seller #{user?.sellerId || user?.id || '—'}
            </span>
            <span style={{ backgroundColor: 'var(--sage-light)', color: 'var(--charcoal)', fontWeight: 600, fontSize: '0.78rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
              Linked User #{user?.id || '—'}
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.4rem', letterSpacing: '-0.03em', fontWeight: 800, color: 'var(--charcoal)', lineHeight: 1.15 }}>
            Create New Campus Listing
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0, lineHeight: 1.5 }}>
            List your textbook, electronics, lab equipment, or dorm essentials for student buyers on campus.
          </p>
        </div>

        {/* Google Books Search & Auto-Fill Feature (Only for Books category) */}
        {formData.category === 'BOOKS' && (
          <div
            style={{
              backgroundColor: 'var(--sage-light)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              marginBottom: '2rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--charcoal)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--charcoal)', margin: 0 }}>
                    Google Books Auto-Fill Assistant
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Type book name or ISBN to import title, author, description, and cover photo instantly!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookModalOpen(true)}
                className="btn btn-outline btn-sm btn-pill"
                style={{ fontWeight: 700 }}
              >
                <Sparkles size={14} /> Full Search Dialog
              </button>
            </div>

            {/* Search Input Bar */}
            <form
              onSubmit={(e) => handleInlineBookSearch(e, bookQuery)}
              style={{ display: 'flex', gap: '0.65rem', marginTop: '0.75rem', flexWrap: 'wrap' }}
            >
              <div style={{ position: 'relative', flex: '1 1 300px' }}>
                <Search
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  placeholder="Type book title or ISBN (e.g. Introduction to Algorithms, Clean Code)..."
                  className="form-input"
                  style={{
                    paddingLeft: '42px',
                    backgroundColor: 'white',
                    fontSize: '0.95rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={searchingBook || !bookQuery.trim()}
                className="btn btn-primary btn-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  fontWeight: 700,
                }}
              >
                {searchingBook ? (
                  <>
                    <Loader2 size={16} className="spin" /> Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Search Book
                  </>
                )}
              </button>
            </form>

            {/* Auto-fill Success Alert */}
            {autofillSuccess && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1.15rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--charcoal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle2 size={18} color="var(--muted-green)" style={{ flexShrink: 0 }} />
                  <span>{autofillSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutofillSuccess(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--charcoal)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Search Results Dropdown Panel */}
            {bookResults.length > 0 && (
              <div
                style={{
                  marginTop: '1.25rem',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  padding: '1.25rem',
                  maxHeight: '450px',
                  overflowY: 'auto',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid var(--sage-light)',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--charcoal)' }}>
                    Found {bookResults.length} book{bookResults.length > 1 ? 's' : ''} on Google Books:
                  </span>
                  <button
                    type="button"
                    onClick={() => setBookResults([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    Close Results ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {bookResults.map((b, idx) => (
                    <div
                      key={b.isbn || idx}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--warm-white)',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <img
                        src={b.coverImageUrl || getCategoryPlaceholder('BOOKS')}
                        alt={b.title}
                        referrerPolicy="no-referrer"
                        style={{
                          width: '56px',
                          height: '78px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          boxShadow: 'var(--shadow-xs)',
                          flexShrink: 0,
                        }}
                        onError={(e) => { e.target.src = getCategoryPlaceholder('BOOKS'); }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.975rem',
                            fontWeight: 800,
                            color: 'var(--charcoal)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {b.title}
                        </h4>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          By <span style={{ fontWeight: 700, color: 'var(--charcoal)' }}>{b.author || 'Unknown Author'}</span>
                          {b.publishedDate ? ` • ${b.publishedDate}` : ''}
                        </p>
                        {b.isbn && (
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ISBN: {b.isbn}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectBook(b)}
                        className="btn btn-primary btn-sm btn-pill"
                        style={{
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 700,
                        }}
                      >
                        <Sparkles size={14} /> Auto-fill
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {serverError && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.25rem',
              color: '#b91c1c',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1.75rem',
            }}
          >
            <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Card */}
        <div
          className="card"
          style={{
            padding: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
            backgroundColor: '#ffffff',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Select Category <span className="req">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`form-select ${errors.category ? 'has-error' : ''}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                required
              >
                <option value="">Select Category</option>
                {CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.category && <div className="form-error">{errors.category}</div>}
            </div>

            {/* Product Title */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                <label className="form-label" htmlFor="title" style={{ margin: 0 }}>
                  Product Title <span className="req">*</span>
                </label>
                {formData.category === 'BOOKS' && formData.title.trim().length > 2 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      setBookQuery(formData.title);
                      handleInlineBookSearch(e, formData.title);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--charcoal)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Search size={13} /> Search Google Books for "{formData.title.substring(0, 22)}..."
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={
                    formData.category === 'BOOKS'
                      ? 'e.g. Introduction to Algorithms, Physics for Scientists, Calculus'
                      : 'e.g. TI-84 Plus CE Calculator, Dorm Desk Lamp, White Lab Coat'
                  }
                  className={`form-input ${errors.title ? 'has-error' : ''}`}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                  maxLength={150}
                  required
                />
                {formData.category === 'BOOKS' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      setBookQuery(formData.title);
                      handleInlineBookSearch(e, formData.title);
                    }}
                    disabled={searchingBook || !formData.title.trim()}
                    className="btn btn-outline btn-pill"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      whiteSpace: 'nowrap',
                    }}
                    title="Search Google Books for this title"
                  >
                    {searchingBook ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                    <span>Lookup</span>
                  </button>
                )}
              </div>
              {errors.title && <div className="form-error">{errors.title}</div>}
              <div className="form-hint">{formData.title.length}/150 characters</div>
            </div>

            {/* Price & Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="price">
                  Price (₹ INR) <span className="req">*</span>
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
                    style={{ paddingLeft: '40px', borderRadius: 'var(--radius-sm)' }}
                    required
                  />
                </div>
                {errors.price && <div className="form-error">{errors.price}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="conditionType">
                  Item Condition
                </label>
                <select
                  id="conditionType"
                  name="conditionType"
                  value={formData.conditionType}
                  onChange={handleChange}
                  className="form-select"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Textbook extra fields if category is BOOKS */}
            {formData.category === 'BOOKS' && (
              <div
                style={{
                  padding: '1.35rem',
                  backgroundColor: 'var(--sage-light)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--charcoal)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <BookOpen size={16} color="var(--muted-green)" /> Textbook Extra Information (Optional)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="author">
                      Author(s)
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

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="isbn">
                      ISBN
                    </label>
                    <input
                      type="text"
                      id="isbn"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleChange}
                      placeholder="e.g. 9780262046305"
                      className="form-input"
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Description <span className="req">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe condition, edition, markings, included cables/accessories, reason for selling..."
                className={`form-textarea ${errors.description ? 'has-error' : ''}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                maxLength={3000}
                required
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
              <div className="form-hint">{formData.description.length}/3000 characters</div>
            </div>

            {/* Image URL & File Upload */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <label className="form-label" htmlFor="imageUrl" style={{ margin: 0 }}>
                  Product Image (Paste URL or Upload File)
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
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Clear Image
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <div style={{ position: 'relative', flexGrow: 1 }}>
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
                    placeholder="Paste image link (e.g. Google Books, Amazon, web image)"
                    className="form-input"
                    style={{ paddingLeft: '42px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                {/* Upload File Input */}
                <label
                  className="btn btn-outline btn-pill"
                  style={{
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 600,
                  }}
                >
                  <Upload size={16} /> {uploadingImage ? 'Uploading...' : 'Upload from Device'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* Quick Preset Category Covers */}
              <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', backgroundColor: 'var(--warm-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.45rem' }}>
                  Or select a standard campus category cover:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, imageUrl: preset.url }));
                        setImagePreviewUrl('');
                        setImageLoadError(false);
                      }}
                      className="btn btn-sm btn-pill"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.3rem 0.75rem',
                        border: formData.imageUrl === preset.url ? '1.5px solid var(--charcoal)' : '1px solid var(--border-subtle)',
                        backgroundColor: formData.imageUrl === preset.url ? 'var(--charcoal)' : '#ffffff',
                        color: formData.imageUrl === preset.url ? '#ffffff' : 'var(--charcoal)',
                        fontWeight: formData.imageUrl === preset.url ? 700 : 500,
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Image Preview & Verification Status */}
              {(imagePreviewUrl || formData.imageUrl) && (
                <div
                  style={{
                    marginTop: '0.85rem',
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
                      width: '76px',
                      height: '76px',
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
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle2 size={16} color="var(--muted-green)" /> Photo Verified
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          This image will display clearly on marketplace cards and the item page.
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <AlertCircle size={16} color="#dc2626" /> Unable to load this image URL
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '2px' }}>
                          Website blocked hotlinking. Click <strong>Upload from Device</strong> or choose a category cover.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Safe Campus Pickup Location & Interactive Map */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
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

            {/* Submit Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <Link to="/browse" className="btn btn-outline btn-pill">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-pill"
                disabled={submitting || uploadingImage}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin" /> Publishing to Campus...
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} /> Publish Listing
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Book Metadata Lookup Modal */}
      {formData.category === 'BOOKS' && (
        <BookLookupModal
          isOpen={bookModalOpen}
          onClose={() => setBookModalOpen(false)}
          onSelectBook={handleSelectBook}
        />
      )}
    </div>
  );
};

export default CreateListingPage;
