import StickerGrid from './StickerGrid';

export default function IslamUniverse({ node, onPick }) {
  return (
    <div className="islam-universe">
      <header className="islam-header parcours-anim">
        <p className="islam-bismillah">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>

        <div className="islam-deco" aria-hidden="true">
          <span className="islam-deco-line" />
          <span className="islam-deco-gem">✦</span>
          <span className="islam-deco-line" />
        </div>

        <h1 className="islam-main-title">Les sources du savoir</h1>
        <p className="islam-main-ar">مَصَادِرُ الْعِلْمِ</p>

        <blockquote className="islam-quote">
          <p className="islam-quote-ar">﴿ وَقُل رَّبِّ زِدۡنِي عِلۡمٗا ﴾</p>
          <cite>Dis : Mon Seigneur, accroîs mon savoir — Tâhâ 20:114</cite>
        </blockquote>

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
