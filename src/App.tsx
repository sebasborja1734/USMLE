import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'

type WhyMissedOption =
  | 'knowledge gap'
  | 'misread'
  | 'changed answer'
  | 'time pressure'
  | 'calculation'
  | 'other'

interface MissEntry {
  id: string
  createdAt: string
  topic: string
  concept: string
  whyMissed: WhyMissedOption
  whyNotes?: string
  rule: string
  tags: string[]
}

interface FormState {
  date: string
  topic: string
  concept: string
  whyMissed: WhyMissedOption
  whyNotes: string
  rule: string
  tagsText: string
}

interface Filters {
  topic: string
  tag: string
  whyMissed: string
  search: string
}

const STORAGE_KEY = 'usmle-miss-entries-v1'

const WHY_OPTIONS: WhyMissedOption[] = [
  'knowledge gap',
  'misread',
  'changed answer',
  'time pressure',
  'calculation',
  'other'
]

const toDateInput = (isoString: string): string => isoString.slice(0, 10)

const defaultFormState = (): FormState => ({
  date: toDateInput(new Date().toISOString()),
  topic: '',
  concept: '',
  whyMissed: 'knowledge gap',
  whyNotes: '',
  rule: '',
  tagsText: ''
})

const parseTags = (tagsText: string): string[] =>
  tagsText
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)

const sortByRecent = (entries: MissEntry[]): MissEntry[] =>
  [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

const loadEntries = (): MissEntry[] => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return sortByRecent(
      parsed
        .filter((item): item is MissEntry => {
          return (
            typeof item === 'object' &&
            item !== null &&
            typeof (item as MissEntry).id === 'string' &&
            typeof (item as MissEntry).createdAt === 'string' &&
            typeof (item as MissEntry).topic === 'string' &&
            typeof (item as MissEntry).concept === 'string' &&
            typeof (item as MissEntry).whyMissed === 'string' &&
            typeof (item as MissEntry).rule === 'string' &&
            Array.isArray((item as MissEntry).tags)
          )
        })
        .map((item) => ({
          ...item,
          tags: item.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean),
          whyNotes: item.whyNotes?.trim() ?? ''
        }))
    )
  } catch {
    return []
  }
}

function App() {
  const [entries, setEntries] = useState<MissEntry[]>(() => loadEntries())
  const [form, setForm] = useState<FormState>(() => defaultFormState())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({ topic: '', tag: '', whyMissed: '', search: '' })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const topics = useMemo(() => {
    const set = new Set(entries.map((entry) => entry.topic.trim()).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [entries])

  const tags = useMemo(() => {
    const set = new Set(entries.flatMap((entry) => entry.tags))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [entries])

  const filteredEntries = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return entries.filter((entry) => {
      const matchesTopic = !filters.topic || entry.topic === filters.topic
      const matchesTag = !filters.tag || entry.tags.includes(filters.tag)
      const matchesWhy = !filters.whyMissed || entry.whyMissed === filters.whyMissed
      const searchBlob = [entry.topic, entry.concept, entry.rule, entry.tags.join(' ')].join(' ').toLowerCase()
      const matchesSearch = !query || searchBlob.includes(query)
      return matchesTopic && matchesTag && matchesWhy && matchesSearch
    })
  }, [entries, filters])

  const topWeakTags = useMemo(() => {
    const counts = new Map<string, number>()
    entries.forEach((entry) => {
      entry.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      })
    })

    return [...counts.entries()]
      .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])))
      .slice(0, 10)
  }, [entries])

  const setField = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const resetForm = () => {
    setForm(defaultFormState())
    setEditingId(null)
  }

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.topic.trim() || !form.concept.trim() || !form.rule.trim()) {
      return
    }

    const createdAt = new Date(`${form.date}T00:00:00`).toISOString()
    const payload: MissEntry = {
      id: editingId ?? crypto.randomUUID(),
      createdAt,
      topic: form.topic.trim(),
      concept: form.concept.trim(),
      whyMissed: form.whyMissed,
      whyNotes: form.whyNotes.trim(),
      rule: form.rule.trim(),
      tags: parseTags(form.tagsText)
    }

    setEntries((prev) => {
      if (editingId) {
        return sortByRecent(prev.map((entry) => (entry.id === editingId ? payload : entry)))
      }
      return sortByRecent([payload, ...prev])
    })

    resetForm()
  }

  const startEdit = (entry: MissEntry) => {
    setEditingId(entry.id)
    setForm({
      date: toDateInput(entry.createdAt),
      topic: entry.topic,
      concept: entry.concept,
      whyMissed: entry.whyMissed,
      whyNotes: entry.whyNotes ?? '',
      rule: entry.rule,
      tagsText: entry.tags.join(', ')
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `usmle-miss-log-${toDateInput(new Date().toISOString())}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid file')
        }

        const imported: MissEntry[] = parsed.map((item) => ({
          id: typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID(),
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
          topic: String(item.topic ?? '').trim(),
          concept: String(item.concept ?? '').trim(),
          whyMissed: WHY_OPTIONS.includes(item.whyMissed) ? item.whyMissed : 'other',
          whyNotes: String(item.whyNotes ?? '').trim(),
          rule: String(item.rule ?? '').trim(),
          tags: Array.isArray(item.tags)
            ? item.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
            : []
        }))

        setEntries(sortByRecent(imported.filter((entry) => entry.topic && entry.concept && entry.rule)))
      } catch {
        alert('Could not import file. Please provide a valid JSON export.')
      } finally {
        event.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  const clearAll = () => {
    if (!window.confirm('Clear all misses? This cannot be undone.')) {
      return
    }
    setEntries([])
    resetForm()
  }

  return (
    <main className="container">
      <h1>USMLE Miss Logger</h1>
      <p className="subhead">Track misses, reinforce rules, and surface your weak tags.</p>

      <section className="card">
        <h2>{editingId ? 'Edit Miss' : 'Add Miss'}</h2>
        <form onSubmit={submitForm} className="grid-form">
          <label>
            Date
            <input type="date" value={form.date} onChange={setField('date')} required />
          </label>
          <label>
            Topic
            <input type="text" value={form.topic} onChange={setField('topic')} placeholder="Renal" required />
          </label>
          <label>
            Concept
            <input type="text" value={form.concept} onChange={setField('concept')} placeholder="Type IV RTA" required />
          </label>
          <label>
            Why I missed it
            <select value={form.whyMissed} onChange={setField('whyMissed')}>
              {WHY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="full-width">
            Why notes (optional)
            <input type="text" value={form.whyNotes} onChange={setField('whyNotes')} placeholder="What specifically happened?" />
          </label>
          <label className="full-width">
            Rule / takeaway
            <textarea value={form.rule} onChange={setField('rule')} rows={2} placeholder="Hyperkalemia + normal anion gap acidosis = think hypoaldosteronism." required />
          </label>
          <label className="full-width">
            Tags (comma-separated)
            <input type="text" value={form.tagsText} onChange={setField('tagsText')} placeholder="renal, acid-base, raas" />
          </label>
          <div className="button-row full-width">
            <button type="submit">{editingId ? 'Save Changes' : 'Add Miss'}</button>
            {editingId && (
              <button type="button" className="secondary" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Top 10 Weak Tags</h2>
        {topWeakTags.length === 0 ? (
          <p className="muted">No tags yet. Add misses to see weak spots.</p>
        ) : (
          <ol className="tag-ranking">
            {topWeakTags.map(([tag, count]) => (
              <li key={tag}>
                <button type="button" className="link-button" onClick={() => setFilters((prev) => ({ ...prev, tag }))}>
                  {tag}
                </button>
                <span>{count}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card">
        <h2>Misses</h2>
        <div className="toolbar">
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search topic, concept, rule, tags"
          />
          <select value={filters.topic} onChange={(event) => setFilters((prev) => ({ ...prev, topic: event.target.value }))}>
            <option value="">All topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
          <select value={filters.tag} onChange={(event) => setFilters((prev) => ({ ...prev, tag: event.target.value }))}>
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <select value={filters.whyMissed} onChange={(event) => setFilters((prev) => ({ ...prev, whyMissed: event.target.value }))}>
            <option value="">All reasons</option>
            {WHY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="bulk-actions">
          <button type="button" className="secondary" onClick={exportJson}>
            Export JSON
          </button>
          <label className="secondary file-input">
            Import JSON
            <input type="file" accept="application/json" onChange={importJson} />
          </label>
          <button type="button" className="danger" onClick={clearAll}>
            Clear all
          </button>
        </div>

        {filteredEntries.length === 0 ? (
          <p className="empty-state">No misses yet. Add your first missed question above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Topic</th>
                  <th>Concept</th>
                  <th>Why missed</th>
                  <th>Rule</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{toDateInput(entry.createdAt)}</td>
                    <td>{entry.topic}</td>
                    <td>{entry.concept}</td>
                    <td>
                      {entry.whyMissed}
                      {entry.whyNotes ? <div className="muted small">{entry.whyNotes}</div> : null}
                    </td>
                    <td>{entry.rule}</td>
                    <td>{entry.tags.join(', ')}</td>
                    <td className="actions">
                      <button type="button" className="secondary" onClick={() => startEdit(entry)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => deleteEntry(entry.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
