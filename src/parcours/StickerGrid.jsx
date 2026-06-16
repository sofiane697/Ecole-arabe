import { cardEnter, cardLeave } from './hoverLift';
import ILLUS from './StickerIllus';

/**
 * Grille de stickers d'un niveau.
 * @param {Array}    nodes  Les nœuds à afficher (enfants du niveau courant)
 * @param {Function} onPick Appelé avec le nœud cliqué (ignoré si disabled)
 */
export default function StickerGrid({ nodes, onPick }) {
  const countCls = nodes.length <= 2 ? `count-${nodes.length}` : '';

  return (
    <div className={`sticker-grid ${countCls}`}>
      {nodes.map((node) => (
        <button
          key={node.id}
          type="button"
          className={`sticker parcours-anim ${node.disabled ? 'is-disabled' : ''}`}
          onClick={() => !node.disabled && onPick(node)}
          onMouseEnter={node.disabled ? undefined : cardEnter}
          onMouseLeave={node.disabled ? undefined : cardLeave}
          disabled={node.disabled}
          aria-label={node.label}
        >
          {node.disabled && <span className="sticker-badge">Bientôt</span>}
          <span className="sticker-ico">{(node.illu && ILLUS[node.illu]) || node.ico}</span>
          <span className="sticker-label">{node.label}</span>
          {node.ar && <span className="sticker-ar">{node.ar}</span>}
          {node.desc && <span className="sticker-desc">{node.desc}</span>}
        </button>
      ))}
    </div>
  );
}
