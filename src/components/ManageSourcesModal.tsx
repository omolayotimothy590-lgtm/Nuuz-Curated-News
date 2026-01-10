import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Loader, AlertCircle, Check } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ManageSourcesModalProps {
  onClose: () => void;
  onSourceAdded?: (source: CustomSource, articles: any[]) => void;
}

interface CustomSource {
  id: string;
  user_id: string;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
  created_at: string;
}

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (source: Partial<CustomSource>, articles?: any[]) => Promise<void>;
  editingSource?: CustomSource | null;
}

const CATEGORIES = [
  { label: 'Business', value: 'business' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Health', value: 'health' },
  { label: 'Politics', value: 'politics' },
  { label: 'Science', value: 'science' },
  { label: 'Sports', value: 'sports' },
  { label: 'Tech', value: 'tech' },
  { label: 'Technology', value: 'technology' },
  { label: 'Travel', value: 'travel' },
  { label: 'World', value: 'world' }
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://itnxliunzuzlvtaswesi.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnhsaXVuenV6bHZ0YXN3ZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDgxNzUsImV4cCI6MjA3ODEyNDE3NX0.q3sP2NKUT3_2GX8Fjq3PkWsUfPHyfHM5ut9SitE0bE0';

const AddEditSourceModal = ({ isOpen, onClose, onSave, editingSource }: AddEditModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: 'tech'
  });
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    if (editingSource) {
      setFormData({
        name: editingSource.name,
        url: editingSource.url,
        category: editingSource.category
      });
    } else {
      setFormData({ name: '', url: '', category: 'tech' });
    }
    setError('');
    setValidationResult(null);
  }, [editingSource, isOpen]);

  const validateAndFetchRSS = async (url: string, name: string, category: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/validate-rss-feed`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, name, category })
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.feedTitle && !formData.name) {
          setFormData(prev => ({ ...prev, name: data.feedTitle }));
        }
        return data;
      } else {
        setError(data.error || 'Invalid RSS feed');
        return null;
      }
    } catch (err) {
      setError('Failed to validate RSS feed');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateAndFetchRSS(formData.url, formData.name, formData.category);

      if (!result) {
        setIsValidating(false);
        return;
      }

      setValidationResult(result);

      await new Promise(resolve => setTimeout(resolve, 1000));

      await onSave(formData, result.articles);
      onClose();
    } catch (err) {
      setError('Failed to save source. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {editingSource ? 'Edit Source' : 'Add Custom Source'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
              Source Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., My Tech Blog"
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
              RSS Feed URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/feed.rss"
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Enter the full RSS feed URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => {
                console.log('💾 Category selected:', e.target.value);
                setFormData({ ...formData, category: e.target.value });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {isValidating && !error && !validationResult && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
              <Loader size={16} className="animate-spin" />
              <div>
                <p className="font-medium">Validating feed and fetching articles...</p>
                <p className="text-xs opacity-75">This may take a few seconds</p>
              </div>
            </div>
          )}

          {error && !isValidating && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-xs mt-1 opacity-75">Please check the URL and try again</p>
              </div>
            </div>
          )}

          {validationResult && !isValidating && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
              <Check size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{validationResult.message}</p>
                <p className="text-xs mt-1 opacity-75">
                  Articles will be added to the <strong>{CATEGORIES.find(c => c.value === formData.category)?.label || formData.category}</strong> category
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <span>{editingSource ? 'Save Changes' : 'Add Source'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ManageSourcesModal = ({ onClose, onSourceAdded }: ManageSourcesModalProps) => {
  const { user } = useAuth();
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSource, setEditingSource] = useState<CustomSource | null>(null);

  useEffect(() => {
    if (user) {
      loadCustomSources();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCustomSources = async () => {
    if (!supabaseEnabled || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomSources(data || []);
    } catch (error) {
      console.error('Failed to load custom sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (sourceData: Partial<CustomSource>, articles?: any[]) => {
    if (!user || !supabaseEnabled || !supabase) return;

    console.log('✅ Saving custom source:', {
      name: sourceData.name,
      url: sourceData.url,
      category: sourceData.category,
      articleCount: articles?.length || 0
    });

    try {
      const { data, error } = await supabase
        .from('custom_sources')
        .insert({
          user_id: user.id,
          name: sourceData.name,
          url: sourceData.url,
          category: sourceData.category,
          enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Custom source saved successfully to category:', data.category);

      await loadCustomSources();

      if (data && articles && articles.length > 0 && onSourceAdded) {
        console.log(`📰 Adding ${articles.length} articles from custom source`);
        onSourceAdded(data, articles);
      }
    } catch (error) {
      console.error('❌ Failed to add source:', error);
      throw error;
    }
  };

  const handleUpdateSource = async (sourceData: Partial<CustomSource>) => {
    if (!user || !editingSource || !supabaseEnabled || !supabase) return;

    try {
      const { error } = await supabase
        .from('custom_sources')
        .update({
          name: sourceData.name,
          url: sourceData.url,
          category: sourceData.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSource.id);

      if (error) throw error;
      await loadCustomSources();
    } catch (error) {
      console.error('Failed to update source:', error);
      throw error;
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!supabaseEnabled || !supabase) return;

    if (!confirm('Are you sure you want to delete this source? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;
      await loadCustomSources();
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const handleToggleEnabled = async (source: CustomSource) => {
    if (!supabaseEnabled || !supabase) return;

    try {
      const { error } = await supabase
        .from('custom_sources')
        .update({ enabled: !source.enabled })
        .eq('id', source.id);

      if (error) throw error;
      await loadCustomSources();
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-fade-in">
        <div
          className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl sm:rounded-xl rounded-t-xl max-h-[85vh] flex flex-col animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Manage My Sources
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
            >
              <X size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {!user ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Sign in to add and manage your custom RSS sources
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        My Custom Sources
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        RSS feeds you've added - only visible to you
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingSource(null);
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      <Plus size={18} />
                      <span>Add Source</span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="animate-spin text-blue-600" size={32} />
                    </div>
                  ) : customSources.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        You haven't added any custom sources yet
                      </p>
                      <button
                        onClick={() => {
                          setEditingSource(null);
                          setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        Add Your First Source
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customSources.map((source) => (
                        <div
                          key={source.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 dark:text-white truncate">
                              {source.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {source.url}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">
                                📂 {CATEGORIES.find(c => c.value === source.category)?.label || source.category}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleEnabled(source)}
                              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                                source.enabled
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {source.enabled ? 'Active' : 'Disabled'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingSource(source);
                                setShowAddModal(true);
                              }}
                              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                              title="Edit"
                            >
                              <Edit2 size={16} className="text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteSource(source.id)}
                              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <AddEditSourceModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSource(null);
        }}
        onSave={editingSource ? handleUpdateSource : handleAddSource}
        editingSource={editingSource}
      />
    </>
  );
};
