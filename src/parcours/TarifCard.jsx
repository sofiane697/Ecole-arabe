import { cardEnter, cardLeave } from './hoverLift';

/**
 * Carte de formule — style « manuscrit doré » éditorial.
 * Carte module (avec `niveau`) → grand chiffre filigrane + sous-titre niveau.
 * Carte sans module (Coran/EDI) → titre serif + mention « Prérequis ».
 */
export default function TarifCard({ tarif: t, onChoose }) {
  const hasModule = !!t.niveau;
  const num = hasModule ? (t.niveau.match(/\d+/)?.[0] || '') : '';
  // Carte-groupe : mène à un sous-écran de tarifs (pas d'inscription directe).
  const isGroupe = Array.isArray(t.tarifs);
  // Carte « minimale » (ex. sourates) : un nom + un prix, sans prérequis ni contenu.
  // → carte compacte, on ne réserve pas la zone prérequis.
  const isMini =
    hasModule && !t.titre && !t.prereq && !t.featureGroups && !(t.features && t.features.length);

  return (
    <button
      type="button"
      className={`tarif-card parcours-anim ${isMini ? 'tarif-card--mini' : ''}`}
      onClick={onChoose}
      onMouseEnter={cardEnter}
      onMouseLeave={cardLeave}
    >
      {num && <span className="tarif-numeral" aria-hidden="true">{num}</span>}

      <div className="tarif-top">
        {hasModule ? (
          <>
            <span className="tarif-niveau">{t.niveau}</span>
            {t.cadence && <span className="tarif-cadence">{t.cadence}</span>}
            {t.titre ? (
              <span className="tarif-titre-lvl">{t.titre}</span>
            ) : isMini ? null : (
              /* Cartes « niveau » (arabe adulte) : zone prérequis toujours
                 rendue (vide pour Expert) → prix et description alignés. */
              <span className="tarif-prereq-line">
                {t.prereq && (
                  <>
                    <span className="tarif-prereq">{t.prereqNone ? 'Aucun prérequis :' : 'Prérequis :'}</span>
                    {t.prereq}
                  </>
                )}
              </span>
            )}
          </>
        ) : (
          <span className="tarif-titre">{t.titre}</span>
        )}
      </div>

      {isGroupe ? (
        /* Carte-groupe : pas de prix, invite à découvrir les formules */
        <p className="tarif-groupe-hint">Plusieurs formules disponibles</p>
      ) : (
        <>
          <div className="tarif-price-row">
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
            {t.rythme && (
              <span className="tarif-rythme">
                {t.rythme.split(' · ').map((r, i) => (
                  <span key={i}>{r}</span>
                ))}
              </span>
            )}
          </div>

          <span className="tarif-rule" aria-hidden="true" />

          {Array.isArray(t.featureGroups) ? (
            t.featureGroups.map((g, gi) => (
              <div className="tarif-feat-group" key={gi}>
                <span className="tarif-feat-group-label">{g.titre}</span>
                <ul className="tarif-feats">
                  {g.items.map((f, i) => (
                    <li key={i}>
                      <span className="tarif-gem" aria-hidden="true">✦</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <ul className="tarif-feats">
              {(t.features || []).map((f, i) => (
                <li key={i}>
                  <span className="tarif-gem" aria-hidden="true">✦</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          {t.note && <span className="tarif-note">{t.note}</span>}
        </>
      )}

      <span className="tarif-pick">
        {isGroupe ? 'Découvrir' : "S'inscrire"}
        <span className="tarif-pick-arrow" aria-hidden="true">→</span>
      </span>
    </button>
  );
}
