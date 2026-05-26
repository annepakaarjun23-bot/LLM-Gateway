import { useState, useRef } from 'react'
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from '../queries/adminQueries'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { format } from 'date-fns'
import { Plus, Copy, Trash2, Check, Key, AlertTriangle, X } from 'lucide-react'

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-border text-text-secondary hover:text-text-primary hover:border-[#c9bfad] transition-colors"
      aria-label={`${label}: ${text}`}
    >
      {copied ? <Check size={12} className="text-accent-secondary" /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  )
}

function CreateKeyModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const { mutateAsync, isPending, error } = useCreateApiKey()
  const inputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await mutateAsync(name.trim())
      onSuccess(result)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/20 px-4" role="dialog" aria-modal="true" aria-label="Create API key">
      <div className="bg-bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">Create API Key</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="key-name" className="block text-sm font-medium text-text-primary mb-1.5">
              Key Name <span className="text-text-secondary font-normal">(optional)</span>
            </label>
            <input
              id="key-name"
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Production API Key"
              className="w-full px-3 py-2 text-sm bg-bg-main border border-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-danger">
              {error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create key. Please try again.'}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-md text-text-secondary hover:bg-bg-main transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 text-sm font-medium bg-accent-primary hover:bg-accent-primary-hover text-white rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Generating…' : 'Generate Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewKeyModal({ keyData, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/20 px-4" role="dialog" aria-modal="true" aria-label="New API key generated">
      <div className="bg-bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">API Key Generated</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-text-secondary mb-1.5">Your API Key</p>
            <div className="flex items-center gap-2 p-3 bg-bg-main border border-border rounded-lg">
              <code className="flex-1 text-xs font-mono text-text-primary break-all select-all">
                {keyData.key}
              </code>
              <CopyButton text={keyData.key} label="Copy" />
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-[#b54a3f]/5 border border-[#b54a3f]/20 rounded-lg">
            <AlertTriangle size={14} className="text-danger shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-danger leading-relaxed">
              Store this key securely. It will not be shown again.
            </p>
          </div>

          {keyData.notice && (
            <p className="text-xs text-text-secondary">{keyData.notice}</p>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium bg-accent-primary hover:bg-accent-primary-hover text-white rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function DeactivateModal({ keyItem, onClose, onConfirm, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/20 px-4" role="dialog" aria-modal="true" aria-label="Confirm deactivation">
      <div className="bg-bg-card border border-border rounded-xl shadow-lg w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-text-primary mb-2">Deactivate Key</h2>
        <p className="text-sm text-text-secondary mb-5">
          Are you sure you want to deactivate{' '}
          <span className="font-medium text-text-primary">
            {keyItem.name || 'this key'}
          </span>
          ? Requests using it will be rejected immediately.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-md text-text-secondary hover:bg-bg-main transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2 text-sm font-medium bg-danger hover:bg-[#9e3d33] text-white rounded-md transition-colors disabled:opacity-60"
          >
            {isPending ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function KeysPage() {
  const { data, isLoading, isError } = useApiKeys()
  const { mutateAsync: deleteKey, isPending: isDeleting } = useDeleteApiKey()
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyData, setNewKeyData] = useState(null)
  const [deactivating, setDeactivating] = useState(null) // key object

  const handleCreateSuccess = (result) => {
    setShowCreate(false)
    setNewKeyData(result)
  }

  const handleDeactivate = async () => {
    if (!deactivating) return
    try {
      await deleteKey(deactivating.id)
    } finally {
      setDeactivating(null)
    }
  }

  const keys = data?.keys ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">API Keys</h2>
          <p className="text-sm text-text-secondary mt-0.5">Manage keys for authenticating API requests.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary-hover text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={15} />
          Create Key
        </button>
      </div>

      {/* Table */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="shimmer h-10 rounded" />)}
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-danger">Failed to load API keys. Please refresh.</div>
        ) : keys.length === 0 ? (
          <EmptyState
            icon={Key}
            title="No API keys yet"
            description="Create your first key to start making requests to the Gateway."
            action={
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary-hover text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                <Plus size={14} />
                Create Key
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border bg-bg-main">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Key ID</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map(key => (
                  <tr key={key.id} className="hover:bg-bg-main transition-colors">
                    <td className="px-5 py-3.5 font-medium text-text-primary">
                      {key.name || <span className="text-text-secondary italic">Unnamed</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs font-mono text-text-secondary">
                        {key.id?.slice(0, 8)}…
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={key.is_active ? 'active' : 'inactive'} dot>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary text-xs">
                      {key.created_at ? format(new Date(key.created_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <CopyButton text={key.id} label="Copy ID" />
                        {key.is_active && (
                          <button
                            onClick={() => setDeactivating(key)}
                            className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-transparent text-danger hover:border-danger/30 hover:bg-danger/5 transition-colors"
                            aria-label={`Deactivate key ${key.name || key.id}`}
                          >
                            <Trash2 size={12} />
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {newKeyData && (
        <NewKeyModal
          keyData={newKeyData}
          onClose={() => setNewKeyData(null)}
        />
      )}
      {deactivating && (
        <DeactivateModal
          keyItem={deactivating}
          onClose={() => setDeactivating(null)}
          onConfirm={handleDeactivate}
          isPending={isDeleting}
        />
      )}
    </div>
  )
}
