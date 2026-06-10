import { cardEnter, cardLeave } from './hoverLift';

/**
 * Une carte de tarif (formule). Style « luxe éditorial épuré ».
 * @param {Object}   tarif   { titre, niveau?, ar?, prix|prixNote, rythme?, features?, featured?, note? }
 * @param {Function} onChoose Appelé au clic sur la carte
 */
export default function TarifCard({ tarif: t, onChoose }) {
  return (
    <button
      type="button"
      className={`tarif-card parcours-anim ${t.featured ? 'feat' : ''}`}
      onClick={onChoose}
      onMouseEnter={cardEnter}
      onMouseLeave={cardLeave}
    >
      {t.featured && <span className="tarif-flag">Recommandé</span>}
      <div className="tarif-top">
        {t.niveau && (
          <span className="tarif-niveau">
            {t.niveau}{t.ar && <span className="tarif-ar"> · {t.ar}</span>}
          </span>
        )}
        <span className="tarif-titre">{t.titre}</span>
      </div>

      <div className="tarif-price-block">
        <span className="tarif-price">
          {t.prix != null ? (
            <>
              <span className="tarif-amount">{t.prix}</span>
              <span className="tarif-unit">€</span>
            </>
          ) : (
            <span className="tarif-amount tarif-amount-sm">{t.prixNote}</span>
          )}
        </span>
        {t.rythme && <span className="tarif-freq">{t.rythme}</span>}
      </div>

      <span className="tarif-sep" />
      <ul className="tarif-feats">
        {(t.features || []).map((f, i) => (
          <li key={i}><span className="tarif-check" aria-hidden="true" />{f}</li>
        ))}
      </ul>
      {t.note && <span className="tarif-note">{t.note}</span>}
      <span className="tarif-pick">
        Choisir cette formule
        <span className="tarif-pick-arrow" aria-hidden="true">→</span>
      </span>
    </button>
  );
}
