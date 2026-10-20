import { useMemo, useState } from 'react'
import { CATEGORY_COLORS, CATEGORY_ICONS, MIN_QUESTIONS_TO_PLAY } from './data'
import {
  addCategory,
  addQuestion,
  deleteCategory,
  deleteQuestion,
  resetDemoData,
  setQuestionStatus,
  updateCategory,
  updateQuestion,
  useStore,
} from './store'
import { ConfirmDialog, EmptyState, Field, Modal, PageHeader } from './ui'
import { Icon } from './Icons'
import { useToast } from './toastContext'

const LETTERS = ['A', 'B', 'C', 'D']
const DIFFICULTIES = ['easy', 'medium', 'hard']

/* ---------- Category form ---------- */

function CategoryForm({ category, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || CATEGORY_ICONS[0],
    color: category?.color || CATEGORY_COLORS[0],
  })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = (e) => {
    e.preventDefault()
    const res = category ? updateCategory(category.id, form) : addCategory(form)
    if (!res.ok) return setErrors(res.errors)
    toast(category ? `Saved changes to ${form.name.trim()}.` : `Added the ${form.name.trim()} category.`, 'success')
    onClose()
  }

  return (
    <Modal
      title={category ? 'Edit category' : 'Add category'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="category-form" className="btn btn-primary">{category ? 'Save changes' : 'Add category'}</button>
        </>
      }
    >
      <form id="category-form" onSubmit={save} noValidate className="form-stack">
        {errors.form && <div className="form-alert" role="alert"><Icon name="info" size={16} />{errors.form}</div>}
        <Field label="Category name" error={errors.name}>
          {(p) => <input {...p} type="text" value={form.name} onChange={set('name')} placeholder="Data structures" maxLength={30} />}
        </Field>
        <Field label="Description" error={errors.description} hint="Shown to players when they pick a category.">
          {(p) => <textarea {...p} rows={3} value={form.description} onChange={set('description')} placeholder="Arrays, trees, graphs and the trade-offs between them." />}
        </Field>

        <fieldset className="fieldset">
          <legend>Icon</legend>
          <div className="swatches">
            {CATEGORY_ICONS.map((ic) => (
              <label key={ic} className={`swatch swatch-icon ${form.icon === ic ? 'is-on' : ''}`}>
                <input type="radio" name="icon" value={ic} checked={form.icon === ic} onChange={set('icon')} />
                <Icon name={ic} size={20} />
                <span className="sr-only">{ic}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Colour</legend>
          <div className="swatches">
            {CATEGORY_COLORS.map((c) => (
              <label key={c} className={`swatch ${form.color === c ? 'is-on' : ''}`} style={{ background: c }}>
                <input type="radio" name="color" value={c} checked={form.color === c} onChange={set('color')} />
                {form.color === c && <Icon name="check" size={18} />}
                <span className="sr-only">Colour {c}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}

/* ---------- Question form ---------- */

function QuestionForm({ question, categories, defaultCategory, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState({
    categoryId: question?.categoryId || defaultCategory || categories[0]?.id || '',
    text: question?.text || '',
    options: question?.options || ['', '', '', ''],
    answer: question?.answer ?? 0,
    difficulty: question?.difficulty || 'easy',
  })
  const [errors, setErrors] = useState({})

  const setOption = (i) => (e) =>
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? e.target.value : o)) }))

  const save = (e) => {
    e.preventDefault()
    const res = question ? updateQuestion(question.id, form) : addQuestion(form)
    if (!res.ok) return setErrors(res.errors)
    toast(question ? 'Question updated.' : 'Question added. It can appear in the next match.', 'success')
    onClose()
  }

  return (
    <Modal
      wide
      title={question ? 'Edit question' : 'Add question'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="question-form" className="btn btn-primary">{question ? 'Save changes' : 'Add question'}</button>
        </>
      }
    >
      <form id="question-form" onSubmit={save} noValidate className="form-stack">
        {errors.form && <div className="form-alert" role="alert"><Icon name="info" size={16} />{errors.form}</div>}
        <div className="form-row">
          <Field label="Category" error={errors.categoryId}>
            {(p) => (
              <select {...p} value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </Field>
          <Field label="Difficulty">
            {(p) => (
              <select {...p} value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}
              </select>
            )}
          </Field>
        </div>

        <Field label="Question" error={errors.text}>
          {(p) => <textarea {...p} rows={2} value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} placeholder="Which data structure uses first in, first out ordering?" />}
        </Field>

        <fieldset className="fieldset">
          <legend>Answers. Select the correct one.</legend>
          {errors.options && <p className="field-error"><Icon name="info" size={14} />{errors.options}</p>}
          {errors.answer && <p className="field-error"><Icon name="info" size={14} />{errors.answer}</p>}
          <div className="answer-list">
            {form.options.map((opt, i) => (
              <div key={i} className={`answer-row ${form.answer === i ? 'is-correct' : ''}`}>
                <label className="answer-radio">
                  <input type="radio" name="correct" checked={form.answer === i} onChange={() => setForm((f) => ({ ...f, answer: i }))} />
                  <span className="answer-letter">{LETTERS[i]}</span>
                  <span className="sr-only">Mark answer {LETTERS[i]} as correct</span>
                </label>
                <Field label={`Answer ${LETTERS[i]}`} error={errors[`option${i}`]}>
                  {(p) => <input {...p} type="text" value={opt} onChange={setOption(i)} />}
                </Field>
              </div>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}

/* ---------- Page ---------- */

export default function AdminPanel() {
  const { data } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('questions')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [catForm, setCatForm] = useState(null) // null | 'new' | category
  const [qForm, setQForm] = useState(null) // null | 'new' | question
  const [confirm, setConfirm] = useState(null)

  const catName = (id) => data.categories.find((c) => c.id === id)?.name || 'Unknown'
  const published = data.questions.filter((q) => q.status === 'published').length

  const visible = useMemo(
    () =>
      data.questions.filter(
        (q) =>
          (filterCat === 'all' || q.categoryId === filterCat) &&
          (filterStatus === 'all' || q.status === filterStatus) &&
          q.text.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [data.questions, filterCat, filterStatus, search],
  )

  const toggleStatus = (q) => {
    const next = q.status === 'published' ? 'hidden' : 'published'
    const res = setQuestionStatus(q.id, next)
    toast(res.ok ? (next === 'hidden' ? 'Question hidden from matches.' : 'Question published.') : res.errors.form, res.ok ? 'success' : 'error')
  }

  const runConfirm = () => {
    const c = confirm
    setConfirm(null)
    const res = c.run()
    toast(res.ok ? c.done : res.errors.form, res.ok ? 'success' : 'error')
  }

  return (
    <div className="stack">
      <PageHeader
        title="Admin panel"
        action={
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => setConfirm({ title: 'Reset demo data?', message: 'This restores the sample categories, questions and players. Accounts you created will be removed.', label: 'Reset data', run: resetDemoData, done: 'Demo data restored.' })}
          >
            <Icon name="refresh" size={16} /> Reset demo data
          </button>
        }
      >
        Add categories, write questions and moderate what players see.
      </PageHeader>

      <section className="stats stats-4" aria-label="Content summary">
        <div className="stat"><strong>{data.categories.length}</strong><span>Categories</span></div>
        <div className="stat"><strong>{data.questions.length}</strong><span>Questions</span></div>
        <div className="stat"><strong>{published}</strong><span>Published</span></div>
        <div className="stat"><strong>{data.questions.length - published}</strong><span>Hidden</span></div>
      </section>

      <div className="tabs tabs-inline" role="tablist" aria-label="Admin sections">
        <button type="button" role="tab" id="adm-q" aria-selected={tab === 'questions'} aria-controls="adm-panel" className="tab" onClick={() => setTab('questions')}>
          <Icon name="list" size={16} /> Questions
        </button>
        <button type="button" role="tab" id="adm-c" aria-selected={tab === 'categories'} aria-controls="adm-panel" className="tab" onClick={() => setTab('categories')}>
          <Icon name="book" size={16} /> Categories
        </button>
      </div>

      <div id="adm-panel" role="tabpanel" aria-labelledby={tab === 'questions' ? 'adm-q' : 'adm-c'}>
        {tab === 'categories' ? (
          <section className="panel">
            <div className="panel-head">
              <h2>Categories</h2>
              <button type="button" className="btn btn-primary btn-small" onClick={() => setCatForm('new')}>
                <Icon name="plus" size={16} /> Add category
              </button>
            </div>
            {data.categories.length === 0 ? (
              <EmptyState icon="book" title="No categories yet" action={<button type="button" className="btn btn-primary btn-small" onClick={() => setCatForm('new')}>Add your first category</button>}>
                Players need a category before they can start a match.
              </EmptyState>
            ) : (
              <ul className="admin-cats">
                {data.categories.map((c) => {
                  const n = data.questions.filter((q) => q.categoryId === c.id).length
                  const live = data.questions.filter((q) => q.categoryId === c.id && q.status === 'published').length
                  return (
                    <li key={c.id} className="admin-cat">
                      <span className="cat-chip-icon" style={{ '--cat': c.color }}><Icon name={c.icon} size={22} /></span>
                      <div className="admin-cat-main">
                        <strong>{c.name}</strong>
                        <small>{c.description}</small>
                        <small className={live < MIN_QUESTIONS_TO_PLAY ? 'warn' : ''}>
                          {n} {n === 1 ? 'question' : 'questions'}, {live} published
                          {live < MIN_QUESTIONS_TO_PLAY && `. Needs ${MIN_QUESTIONS_TO_PLAY - live} more to be playable.`}
                        </small>
                      </div>
                      <div className="row-actions">
                        <button type="button" className="icon-btn" onClick={() => { setQForm('new'); setFilterCat(c.id); setTab('questions') }} aria-label={`Add a question to ${c.name}`} title="Add question"><Icon name="plus" size={18} /></button>
                        <button type="button" className="icon-btn" onClick={() => setCatForm(c)} aria-label={`Edit ${c.name}`} title="Edit"><Icon name="edit" size={18} /></button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          aria-label={`Delete ${c.name}`}
                          title="Delete"
                          onClick={() => setConfirm({ title: `Delete ${c.name}?`, message: `This also deletes its ${n} ${n === 1 ? 'question' : 'questions'}. This cannot be undone.`, label: 'Delete category', run: () => deleteCategory(c.id), done: `Deleted ${c.name}.` })}
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        ) : (
          <section className="panel">
            <div className="panel-head">
              <h2>Questions</h2>
              <button type="button" className="btn btn-primary btn-small" disabled={data.categories.length === 0} onClick={() => setQForm('new')}>
                <Icon name="plus" size={16} /> Add question
              </button>
            </div>

            <div className="toolbar">
              <div className="search">
                <Icon name="search" size={18} />
                <label htmlFor="q-search" className="sr-only">Search questions</label>
                <input id="q-search" type="search" placeholder="Search questions" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <label className="select-wrap">
                <span className="sr-only">Filter by category</span>
                <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                  <option value="all">All categories</option>
                  {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="select-wrap">
                <span className="sr-only">Filter by status</span>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">Any status</option>
                  <option value="published">Published</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
            </div>

            {visible.length === 0 ? (
              <EmptyState icon="search" title="No questions match">Change the filters, or add a new question.</EmptyState>
            ) : (
              <ul className="q-list">
                {visible.map((q) => (
                  <li key={q.id} className={`q-row ${q.status === 'hidden' ? 'is-hidden' : ''}`}>
                    <div className="q-row-main">
                      <p>{q.text}</p>
                      <div className="q-row-meta">
                        <span className="chip">{catName(q.categoryId)}</span>
                        <span className={`chip chip-${q.difficulty}`}>{q.difficulty}</span>
                        <span className={`chip ${q.status === 'published' ? 'chip-win' : 'chip-draw'}`}>{q.status === 'published' ? 'Published' : 'Hidden'}</span>
                        <span className="q-row-answer">Answer: {LETTERS[q.answer]}. {q.options[q.answer]}</span>
                      </div>
                    </div>
                    <div className="row-actions">
                      <button type="button" className="icon-btn" onClick={() => toggleStatus(q)} aria-label={q.status === 'published' ? 'Hide question from matches' : 'Publish question'} title={q.status === 'published' ? 'Hide from matches' : 'Publish'}>
                        <Icon name={q.status === 'published' ? 'eyeOff' : 'eye'} size={18} />
                      </button>
                      <button type="button" className="icon-btn" onClick={() => setQForm(q)} aria-label="Edit question" title="Edit"><Icon name="edit" size={18} /></button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        aria-label="Delete question"
                        title="Delete"
                        onClick={() => setConfirm({ title: 'Delete this question?', message: q.text, label: 'Delete question', run: () => deleteQuestion(q.id), done: 'Question deleted.' })}
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {catForm && <CategoryForm category={catForm === 'new' ? null : catForm} onClose={() => setCatForm(null)} />}
      {qForm && (
        <QuestionForm
          question={qForm === 'new' ? null : qForm}
          categories={data.categories}
          defaultCategory={filterCat !== 'all' ? filterCat : undefined}
          onClose={() => setQForm(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog title={confirm.title} message={confirm.message} confirmLabel={confirm.label} danger onConfirm={runConfirm} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
