import type * as PageTree from 'fumadocs-core/page-tree'
import type { ReactNode } from 'react'

export interface SheetPage {
  name: string
  url: string
}

export interface SheetFolder {
  name: string
  /** the folder's own index page, if it has one */
  url?: string
  pages: SheetPage[]
}

export interface SheetGroup {
  /** the meta.json separator heading the group (none for pages before the first one) */
  label: string | null
  rows: (SheetPage | SheetFolder)[]
}

const text = (name: ReactNode) => (typeof name === 'string' ? name : String(name ?? ''))

// Every page under a folder, flattened to one level - the docs nest no deeper than that today,
// and the phone menu shouldn't grow a third indent level if a subfolder ever appears
function folderPages(nodes: PageTree.Node[]) {
  // a typed accumulator rather than a return-type annotation (banned by the lint config), which
  // also gives the recursive call a type to check against
  const pages: SheetPage[] = []
  for (const n of nodes) {
    if (n.type === 'page') pages.push({ name: text(n.name), url: n.url })
    if (n.type === 'folder') {
      if (n.index) pages.push({ name: text(n.index.name), url: n.index.url })
      pages.push(...folderPages(n.children))
    }
  }
  return pages
}

/**
 * Fumadocs' page tree, reshaped into the phone menu sheet's groups (DocsSheetTree). Plain data,
 * built on the server: the tree's names/icons are React nodes, and the sheet only needs strings
 * and URLs, so this keeps the client payload small and serializable. Lives outside the 'use
 * client' component so the layout (a server component) can call it.
 */
export function toSheetGroups(tree: PageTree.Root) {
  const groups: SheetGroup[] = [{ label: null, rows: [] }]
  for (const node of tree.children) {
    if (node.type === 'separator') {
      groups.push({ label: text(node.name), rows: [] })
    } else if (node.type === 'page') {
      groups[groups.length - 1].rows.push({ name: text(node.name), url: node.url })
    } else {
      groups[groups.length - 1].rows.push({
        name: text(node.name),
        url: node.index?.url,
        pages: folderPages(node.children),
      })
    }
  }
  return groups.filter(g => g.rows.length > 0)
}
