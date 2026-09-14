'use client';

import { useState, useRef } from 'react';
import { createTemplate, updateTemplate, deleteTemplate } from '@/lib/api';
import type { EmbedTemplate } from '@/lib/api';
import { toast } from 'sonner';
import { CyberModal } from '@/components/CyberModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmojiPicker } from '@/components/EmojiPicker';
import EmbedPreview from '@/components/EmbedPreview';

interface FormData {
  type: string;
  enabled: boolean;
  title: string;
  description: string;
  color: string;
  authorName: string;
  authorIcon: string;
  authorIconMode: 'url' | 'emoji';
  footerText: string;
  footerIcon: string;
  footerIconMode: 'url' | 'emoji';
  imageUrl: string;
  thumbnailUrl: string;
  timestamp: boolean;
}

const emptyForm: FormData = {
  type: '',
  enabled: true,
  title: '',
  description: '',
  color: '',
  authorName: '',
  authorIcon: '',
  authorIconMode: 'url',
  footerText: '',
  footerIcon: '',
  footerIconMode: 'url',
  imageUrl: '',
  thumbnailUrl: '',
  timestamp: false,
};

export default function TemplatesClient({ initialTemplates }: { initialTemplates: EmbedTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmbedTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; template: EmbedTemplate | null }>({
    open: false,
    template: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<'author' | 'footer' | null>(null);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<DOMRect | null>(null);
  const authorEmojiButtonRef = useRef<HTMLButtonElement>(null);
  const footerEmojiButtonRef = useRef<HTMLButtonElement>(null);

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (template: EmbedTemplate) => {
    setEditingTemplate(template);
    
    // Detect if icon values are emoji or URLs
    const isAuthorEmoji = template.authorIcon && template.authorIcon.length <= 2 && !template.authorIcon.startsWith('http');
    const isFooterEmoji = template.footerIcon && template.footerIcon.length <= 2 && !template.footerIcon.startsWith('http');
    
    setFormData({
      type: template.type,
      enabled: template.enabled,
      title: template.title || '',
      description: template.description || '',
      color: template.color || '',
      authorName: template.authorName || '',
      authorIcon: template.authorIcon || '',
      authorIconMode: isAuthorEmoji ? 'emoji' : 'url',
      footerText: template.footerText || '',
      footerIcon: template.footerIcon || '',
      footerIconMode: isFooterEmoji ? 'emoji' : 'url',
      imageUrl: template.imageUrl || '',
      thumbnailUrl: template.thumbnailUrl || '',
      timestamp: template.timestamp,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTemplate) {
        const updated = await updateTemplate(editingTemplate.type, {
          enabled: formData.enabled,
          title: formData.title.trim() || null,
          description: formData.description.trim() || null,
          color: formData.color.trim() || null,
          authorName: formData.authorName.trim() || null,
          authorIcon: formData.authorIcon.trim() || null,
          footerText: formData.footerText.trim() || null,
          footerIcon: formData.footerIcon.trim() || null,
          imageUrl: formData.imageUrl.trim() || null,
          thumbnailUrl: formData.thumbnailUrl.trim() || null,
          timestamp: formData.timestamp,
        });
        setTemplates(templates.map((t) => (t.type === updated.type ? updated : t)));
        toast.success(`Template "${updated.type}" aktualisiert`);
      } else {
        const created = await createTemplate({
          type: formData.type,
          enabled: formData.enabled,
          title: formData.title.trim() || null,
          description: formData.description.trim() || null,
          color: formData.color.trim() || null,
          authorName: formData.authorName.trim() || null,
          authorIcon: formData.authorIcon.trim() || null,
          footerText: formData.footerText.trim() || null,
          footerIcon: formData.footerIcon.trim() || null,
          imageUrl: formData.imageUrl.trim() || null,
          thumbnailUrl: formData.thumbnailUrl.trim() || null,
          timestamp: formData.timestamp,
        });
        setTemplates([...templates, created]);
        toast.success(`Template "${created.type}" erstellt`);
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.template) return;

    try {
      await deleteTemplate(deleteConfirm.template.type);
      setTemplates(templates.filter((t) => t.type !== deleteConfirm.template!.type));
      toast.success(`Template "${deleteConfirm.template.type}" gelöscht`);
      setDeleteConfirm({ open: false, template: null });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Löschen');
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    setFormData({ ...formData, description: formData.description + placeholder });
  };

  return (
    <>
      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full md:w-auto"
          style={{
            background: 'var(--emerald)',
            color: 'white',
          }}
        >
          + Neues Template
        </button>
      </div>

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <div
            key={template.type}
            className="rounded-xl p-4 md:p-5 transition-colors"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                  <code
                    className="px-2 py-1 rounded text-xs md:text-sm font-medium"
                    style={{ background: 'var(--amber-bg)', color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}
                  >
                    {template.type}
                  </code>
                  {template.enabled ? (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: 'var(--emerald-bg)', color: 'var(--emerald)' }}
                    >
                      ✓ Aktiv
                    </span>
                  ) : (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: 'var(--red-bg)', color: 'var(--red)' }}
                    >
                      ✕ Inaktiv
                    </span>
                  )}
                </div>
                {template.title && (
                  <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {template.title}
                  </div>
                )}
                {template.description && (
                  <div className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {template.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 md:flex-initial px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => setDeleteConfirm({ open: true, template })}
                  className="flex-1 md:flex-initial px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{ background: 'var(--red-bg)', color: 'var(--red)' }}
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <CyberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? `Template bearbeiten: ${editingTemplate.type}` : 'Neues Template'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="template-editor-grid">
            {/* Left: Form */}
            <div className="template-form-column">
              {!editingTemplate && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Type (eindeutig, nur lowercase/zahlen/_)
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    pattern="[a-z0-9_]+"
                    className="w-full px-4 py-2.5 rounded text-sm"
                    style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enabled" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Template aktiviert
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Titel
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded text-sm"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Beschreibung
                  </label>
                  <div className="flex gap-1">
                    {['{user}', '{username}', '{server}', '{memberCount}'].map((ph) => (
                      <button
                        key={ph}
                        type="button"
                        onClick={() => insertPlaceholder(ph)}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}
                      >
                        {ph}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded text-sm"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Farbe
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => {
                      const val = e.target.value.replace('#', '').toUpperCase();
                      setFormData({ ...formData, color: val });
                    }}
                    placeholder="E73C4E"
                    pattern="[0-9A-Fa-f]{6}"
                    className="flex-1 px-4 py-2.5 rounded text-sm"
                    style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.color ? `#${formData.color}` : '#000000'}
                      onChange={(e) => {
                        const hex = e.target.value.replace('#', '').toUpperCase();
                        setFormData({ ...formData, color: hex });
                      }}
                      className="w-10 h-10 rounded cursor-pointer"
                      style={{ border: '1px solid var(--border-default)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded text-sm"
                    style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Author Icon
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, authorIconMode: 'emoji' })}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{
                        background: formData.authorIconMode === 'emoji' ? 'var(--amber-bg)' : 'var(--bg-base)',
                        color: formData.authorIconMode === 'emoji' ? 'var(--amber)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      Emoji
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, authorIconMode: 'url' })}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{
                        background: formData.authorIconMode === 'url' ? 'var(--amber-bg)' : 'var(--bg-base)',
                        color: formData.authorIconMode === 'url' ? 'var(--amber)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      URL
                    </button>
                  </div>
                  {formData.authorIconMode === 'emoji' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.authorIcon}
                        readOnly
                        placeholder="Kein Emoji"
                        className="flex-1 px-4 py-2.5 rounded text-sm text-center text-2xl"
                        style={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <button
                        ref={authorEmojiButtonRef}
                        type="button"
                        onClick={() => {
                          if (authorEmojiButtonRef.current) {
                            setEmojiPickerAnchor(authorEmojiButtonRef.current.getBoundingClientRect());
                            setEmojiPickerOpen('author');
                          }
                        }}
                        className="px-3 py-2 rounded text-xs font-medium transition-colors"
                        style={{
                          background: 'var(--emerald-bg)',
                          color: 'var(--emerald)',
                        }}
                      >
                        Wählen
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.authorIcon}
                      onChange={(e) => setFormData({ ...formData, authorIcon: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 rounded text-sm"
                      style={{
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={formData.footerText}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded text-sm"
                    style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Footer Icon
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, footerIconMode: 'emoji' })}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{
                        background: formData.footerIconMode === 'emoji' ? 'var(--amber-bg)' : 'var(--bg-base)',
                        color: formData.footerIconMode === 'emoji' ? 'var(--amber)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      Emoji
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, footerIconMode: 'url' })}
                      className="px-3 py-1 rounded text-xs transition-colors"
                      style={{
                        background: formData.footerIconMode === 'url' ? 'var(--amber-bg)' : 'var(--bg-base)',
                        color: formData.footerIconMode === 'url' ? 'var(--amber)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      URL
                    </button>
                  </div>
                  {formData.footerIconMode === 'emoji' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.footerIcon}
                        readOnly
                        placeholder="Kein Emoji"
                        className="flex-1 px-4 py-2.5 rounded text-sm text-center text-2xl"
                        style={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <button
                        ref={footerEmojiButtonRef}
                        type="button"
                        onClick={() => {
                          if (footerEmojiButtonRef.current) {
                            setEmojiPickerAnchor(footerEmojiButtonRef.current.getBoundingClientRect());
                            setEmojiPickerOpen('footer');
                          }
                        }}
                        className="px-3 py-2 rounded text-xs font-medium transition-colors"
                        style={{
                          background: 'var(--emerald-bg)',
                          color: 'var(--emerald)',
                        }}
                      >
                        Wählen
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.footerIcon}
                      onChange={(e) => setFormData({ ...formData, footerIcon: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 rounded text-sm"
                      style={{
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded text-sm"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Thumbnail URL
                </label>
                <input
                  type="text"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded text-sm"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="timestamp"
                  checked={formData.timestamp}
                  onChange={(e) => setFormData({ ...formData, timestamp: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="timestamp" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Zeitstempel anzeigen
                </label>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="template-preview-column">
              <label className="block text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                Live-Vorschau
              </label>
              <EmbedPreview template={formData} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 rounded text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded text-sm font-medium transition-colors"
              style={{ background: 'var(--emerald)', color: 'white' }}
            >
              {isSubmitting ? 'Speichern...' : editingTemplate ? 'Aktualisieren' : 'Erstellen'}
            </button>
          </div>
        </form>
      </CyberModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, template: null })}
        onConfirm={handleDelete}
        title="Template löschen?"
        message={`Möchtest du das Template "${deleteConfirm.template?.type}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
      />

      {/* Emoji Picker */}
      <EmojiPicker
        isOpen={emojiPickerOpen !== null}
        onClose={() => {
          setEmojiPickerOpen(null);
          setEmojiPickerAnchor(null);
        }}
        anchorRect={emojiPickerAnchor}
        onSelect={(emoji) => {
          if (emojiPickerOpen === 'author') {
            setFormData({ ...formData, authorIcon: emoji });
          } else if (emojiPickerOpen === 'footer') {
            setFormData({ ...formData, footerIcon: emoji });
          }
        }}
      />

      <style jsx>{`
        .template-editor-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 1024px) {
          .template-editor-grid {
            display: grid;
            grid-template-columns: 1fr 520px;
            gap: 2rem;
            align-items: start;
          }
        }

        .template-form-column {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: none;
          overflow-y: visible;
        }

        @media (min-width: 1024px) {
          .template-form-column {
            max-height: 70vh;
            overflow-y: auto;
            padding-right: 0.5rem;
          }
        }

        .template-preview-column {
          position: relative;
        }

        @media (min-width: 1024px) {
          .template-preview-column {
            position: sticky;
            top: 0;
            align-self: start;
          }
        }

        /* Scrollbar for form column */
        .template-form-column::-webkit-scrollbar {
          width: 6px;
        }

        .template-form-column::-webkit-scrollbar-track {
          background: transparent;
        }

        .template-form-column::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 3px;
        }

        .template-form-column::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </>
  );
}
