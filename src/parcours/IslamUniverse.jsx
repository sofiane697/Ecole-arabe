import StickerGrid from './StickerGrid';

export default function IslamUniverse({ node, onPick }) {
  return (
    <div className="islam-universe">
      <header className="islam-header parcours-anim">
        <div className="islam-deco" aria-hidden="true">
          <span className="islam-deco-line" />
          <span className="islam-deco-gem">✦</span>
          <span className="islam-deco-line" />
        </div>

        <h1 className="islam-main-title">Les sources du savoir</h1>
        <p className="islam-main-ar">مَصَادِرُ الْعِلْمِ</p>

        <p className="islam-tagline">
          Un format 100% distanciel qui s'adapte à votre rythme et à vos envies.
        </p>

        <div className="islam-deco" aria-hidden="true">
          <span className="islam-deco-line" />
          <span className="islam-deco-gem">✦</span>
          <span className="islam-deco-line" />
        </div>

        <p className="islam-nav-label">Choisissez votre parcours</p>
      </header>

      <div className="islam-stickers parcours-anim">
        <StickerGrid nodes={node.children} onPick={onPick} />
      </div>
    </div>
  );
}
