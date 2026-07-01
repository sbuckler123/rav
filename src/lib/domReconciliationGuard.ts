/**
 * Guards against `NotFoundError: Failed to execute 'removeChild'/'insertBefore'
 * on 'Node'` crashes caused by browser translation extensions (Google Translate,
 * in particular) mutating the DOM out from under React.
 *
 * When Chrome translates the page it wraps text nodes in <font> elements and
 * moves them around. React later tries to remove/insert a node that is no longer
 * where it expects, and the raw DOM call throws a NotFoundError (DOMException
 * code 8). Since the site is Hebrew, any visitor whose Chrome is set to another
 * language triggers auto-translation, so this hits real users.
 *
 * The React team's recommended workaround is to make these two methods tolerant:
 * if the target node isn't actually a child of `this`, fall back to a no-op /
 * plain append rather than throwing. See facebook/react#11538.
 *
 * Must run before React renders.
 */
export function installDomReconciliationGuard() {
  if (typeof Node !== 'function' || !Node.prototype) return;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn('Suppressed removeChild on a node whose parent changed (browser translation?).', child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn('Suppressed insertBefore against a reference node whose parent changed (browser translation?).', referenceNode);
      }
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}
