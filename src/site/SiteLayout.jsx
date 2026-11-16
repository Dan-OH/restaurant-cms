import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { supabase } from '../lib/supabase.js'
import { ROOT, childrenByParent, pagePaths } from '../lib/pageTree.js'
import { LOGO_SRC, SITE_NAME } from '../lib/site.js'
import SiteAdminBar from './SiteAdminBar.jsx'
import './site.css'

// Turns the flat rows into nested nav nodes (each with its `path`), leaving out drafts, pages
// that are hidden from the navigation, and groups that end up with nothing to show.
// (Drafts are only ever in `rows` for a logged-in editor; the navigation always shows what
// visitors see.)
function buildNav(rows, paths) {
  const tree = childrenByParent(rows)
  function build(parentId) {
    const nodes = []
    for (const row of tree.get(parentId) ?? []) {
      if (row.kind === 'group') {
        const children = build(row.id)
        if (children.length > 0) nodes.push({ ...row, children })
      } else if (row.published && row.show_in_nav && paths.has(row.id)) {
        nodes.push({ ...row, path: paths.get(row.id) })
      }
    }
    return nodes
  }
  return build(ROOT)
}

function containsPath(node, pathname) {
  if (node.kind !== 'group') return node.path === pathname
  return node.children.some((child) => containsPath(child, pathname))
}

export default function SiteLayout() {
  const { session, loading: authLoading } = useAuth()
  const isEditor = Boolean(session)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Every page and group this person may see: published ones for visitors, plus drafts for
  // a logged-in editor (so an editor can open and edit a draft from the bar). One request
  // serves both the navigation and working out which page a URL points at. null while loading.
  const [rows, setRows] = useState(null)

  const load = useCallback(async () => {
    let query = supabase.from('pages').select('*')
    if (!isEditor) query = query.eq('published', true)
    const { data, error } = await query
    if (error) console.error('Could not load pages', error)
    return data ?? []
  }, [isEditor])

  // Runs once we know whether someone is logged in, and again on logging in or out.
  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    load().then((data) => {
      if (!cancelled) setRows(data)
    })
    return () => {
      cancelled = true
    }
  }, [authLoading, load])

  const paths = useMemo(() => pagePaths(rows ?? []), [rows])
  const nav = useMemo(() => buildNav(rows ?? [], paths), [rows, paths])

  // "/menus/lunch/" and "/menus/lunch" are the same page.
  const path = pathname.replace(/\/+$/, '') || '/'
  // The page this URL points at, if any. Only pages have an address of their own; a group's
  // path on its own is not a page.
  const page = useMemo(
    () => rows?.find((row) => row.kind !== 'group' && paths.get(row.id) === path) ?? null,
    [rows, paths, path],
  )

  // Called after the current page is edited from the bar. Its address may have changed
  // (new slug or group), in which case we follow it there.
  async function handlePageSaved(saved) {
    const fresh = await load()
    setRows(fresh)
    const newPath = pagePaths(fresh).get(saved.id)
    if (newPath && newPath !== path) navigate(newPath, { replace: true })
  }

  return (
    <div className="site">
      <SiteAdminBar page={page} pages={rows ?? []} onPageSaved={handlePageSaved} />
      <header className="site-header">
        <Link to="/" className="site-logo">
          <img src={LOGO_SRC} alt="" width="40" height="40" />
          <span>{SITE_NAME}</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          {nav.map((node) => (
            <NavItem key={node.id} node={node} />
          ))}
        </nav>
      </header>
      <main className="site-main">
        <Outlet context={{ loading: !rows, page }} />
      </main>
    </div>
  )
}

function NavItem({ node, onNavigate }) {
  if (node.kind === 'group') return <NavGroup group={node} />
  return (
    <NavLink to={node.path} end onClick={onNavigate}>
      {node.title}
    </NavLink>
  )
}

// A group in the header: a button that opens a dropdown with the group's pages.
// Groups inside the dropdown expand in place (see NavSubgroup).
function NavGroup({ group }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const active = containsPath(group, pathname)

  return (
    <div className="site-nav-group" ref={rootRef}>
      <button
        type="button"
        className={`site-nav-toggle${active ? ' active' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {group.title}
        <span className="site-nav-caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="site-nav-dropdown">
          <NavDropdownItems nodes={group.children} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

function NavDropdownItems({ nodes, onNavigate }) {
  return nodes.map((node) =>
    node.kind === 'group' ? (
      <NavSubgroup key={node.id} group={node} onNavigate={onNavigate} />
    ) : (
      <NavItem key={node.id} node={node} onNavigate={onNavigate} />
    ),
  )
}

// A group inside a dropdown: opens in place, indented, rather than as a second floating menu.
function NavSubgroup({ group, onNavigate }) {
  const { pathname } = useLocation()
  // Start open when the current page is inside, so the visitor can see where they are.
  const [open, setOpen] = useState(() => containsPath(group, pathname))

  return (
    <div className="site-nav-subgroup">
      <button
        type="button"
        className="site-nav-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {group.title}
        <span className="site-nav-caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="site-nav-subgroup-items">
          <NavDropdownItems nodes={group.children} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  )
}
