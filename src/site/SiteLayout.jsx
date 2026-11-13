import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ROOT, childrenByParent, pagePaths } from '../lib/pageTree.js'
import { LOGO_SRC, SITE_NAME } from '../lib/site.js'
import './site.css'

// Turns the flat rows into nested nav nodes (each with its `path`), leaving out pages that
// are hidden from the navigation and groups that end up with nothing to show.
function buildNav(rows, paths) {
  const tree = childrenByParent(rows)
  function build(parentId) {
    const nodes = []
    for (const row of tree.get(parentId) ?? []) {
      if (row.kind === 'group') {
        const children = build(row.id)
        if (children.length > 0) nodes.push({ ...row, children })
      } else if (row.show_in_nav && paths.has(row.id)) {
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
  // Every published page and group. One request serves both the navigation and working out
  // which page a URL points at (see SitePage). null while loading.
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('pages')
      .select('*')
      .eq('published', true)
      .then(({ data, error }) => {
        if (error) console.error('Could not load pages', error)
        if (!cancelled) setRows(data ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const paths = useMemo(() => pagePaths(rows ?? []), [rows])
  const nav = useMemo(() => buildNav(rows ?? [], paths), [rows, paths])

  return (
    <div className="site">
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
        <Outlet context={{ rows, paths }} />
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
