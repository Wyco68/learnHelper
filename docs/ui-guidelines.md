# UI Guidelines

Loaded by `/feat` only. Conventions already in use — match them.

## Theme
Dark, code-editor look. Tailwind utility classes only, no separate CSS
files beyond [app/globals.css](../app/globals.css) (custom scrollbar +
base body color).

| Surface | Color |
|---|---|
| Sidebar background | `#0a0e14` |
| Main pane background | `#0d1117` |
| Modal panel background | `#161b22` |
| Borders | `border-white/10` |
| Primary text | `text-gray-200` / `text-gray-100` |
| Muted text | `text-gray-400` / `text-gray-500` |

| Action | Color |
|---|---|
| Primary action (Connect, Create, Generate, Upload) | `bg-blue-600` / hover `bg-blue-500` |
| Destructive action (Delete, Disconnect) | `bg-red-600` / hover `bg-red-500` |
| Connected/success state | `text-emerald-300`, `bg-emerald-400` dot |
| Success toast | `border-emerald-800/60 bg-emerald-950/90 text-emerald-200` |
| Error toast | `border-red-800/60 bg-red-950/90 text-red-200` |

## Components
- **Modals**: every modal wraps [components/modals/Modal.tsx](../components/modals/Modal.tsx)
  (dimmed backdrop, centered panel, click-outside-to-close). Don't build a
  one-off modal shell.
- **Destructive confirmation**: every delete/disconnect action goes through
  [components/modals/ConfirmModal.tsx](../components/modals/ConfirmModal.tsx)
  — never a native `confirm()`, never delete without it.
- **Toasts**: success/failure feedback after an action goes through
  [components/toast/ToastProvider.tsx](../components/toast/ToastProvider.tsx)'s
  `useToast()` hook (`toast.success(...)` / `toast.error(...)`), mounted
  once at the root layout. Don't build a second notification mechanism.
- **Hover-reveal actions**: row-level destructive icons (folder/lesson
  delete) are hidden by default, shown on `group-hover` — see
  [components/sidebar/FileTreeNode.tsx](../components/sidebar/FileTreeNode.tsx)
  for the pattern (`group` on the row, `hidden group-hover:flex` on the
  icon button).
- **Icons**: hand-rolled inline SVG components under
  [components/icons/](../components/icons/) (e.g. `TrashIcon`), no icon
  library dependency.

## Rendering generated content
Lesson HTML is never inserted via `dangerouslySetInnerHTML`. It's parsed
and walked node-by-node in
[components/viewer/HtmlRenderer.tsx](../components/viewer/HtmlRenderer.tsx),
mapping each allowed tag to a real React element so callouts and Mermaid
diagrams get their own components. Any new tag in the output contract
(see [html-output-contract.md](html-output-contract.md)) needs a matching
case added there.

## Motion
`framer-motion` for the lesson-switch fade/slide
([components/viewer/LessonViewer.tsx](../components/viewer/LessonViewer.tsx))
and the Mermaid diagram fade-in. Keep transitions short (~0.3s) and subtle
— this is a study tool, not a marketing site.
