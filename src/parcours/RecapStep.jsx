import { useRef, useState } from 'react';
import gsap from 'gsap';
import CoordonneesFields, { emptyCoordForm, splitIdentity } from './CoordonneesFields';
import { submitPreinscription, derivePathMeta } from './supabasePreinscription';
import {
  DISPO_JOURS_SEMAINE, DISPO_CRENEAUX_SEMAINE, DISPO_CRENEAUX_SEMAINE_ENFANT,
  DISPO_WEEKEND_JOURS, DISPO_AUCUNE,
  toggleDispo, weekLabel, weekendLabel, removeJour,
} from './disponibilites';

const btnEnter = (e) => gsap.to(e.currentTarget, { y: -2, duration: 0.25, ease: 'power3.out' });
const btnLeave = (e) => gsap.to(e.currentTarget, { y: 0, duration: 0.25, ease: 'power3.out' });

/**
 * Écran récapitulatif (« compte rendu ») : résumé du pack choisi + formulaire.
 * Layout « checkout » : panneau Votre sélection à gauche, coordonnées à droite.
 * L'envoi écrit réellement en base via la RPC `submit_preinscription`.
 *
 * @param {Array}    path  Nœuds traversés (pôle → public → matière)
 * @param {Object}   tarif Tarif sélectionné
 * @param {Function} onSent Appelé après envoi réussi
 */
export default function RecapStep({ path, tarif, onSent }) {
  const [form, setForm]               = useState(emptyCoordForm);
  const [dispos, setDispos]           = useState([]);
  const [joursOuverts, setJoursOuverts] = useState([]);
  const [besoin, setBesoin]           = useState('');
  const [choixSelected, setChoixSelected] = useState('');
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState('');
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const { est_enfant: estEnfant, format } = derivePathMeta(path);
  // Disponibilités : adulte toujours ; enfant uniquement en visioconférence
  // (pas en autonomie ni en cours particulier).
  const showDispo = !estEnfant || format === 'visioconference';
  // Adulte : coordonnées courtes → côte à côte avec les disponibilités.
  // Enfant : coordonnées déjà scindées enfant/parent → dispo pleine largeur.
  const splitFormCols = showDispo && !estEnfant;
  // En semaine : enfant = soirée uniquement.
  const creneauxSemaine = estEnfant ? DISPO_CRENEAUX_SEMAINE_ENFANT : DISPO_CRENEAUX_SEMAINE;
  // Semaine : on ouvre un jour, puis on coche ses créneaux (libellé « Jour · Créneau »).
  const toggleJour = (jour) => {
    if (joursOuverts.includes(jour)) {
      setJoursOuverts((o) => o.filter((j) => j !== jour));
      setDispos((cur) => removeJour(cur, jour)); // referme → retire ses créneaux
    } else {
      setJoursOuverts((o) => [...o, jour]);
      setDispos((cur) => cur.filter((v) => v !== DISPO_AUCUNE)); // un jour exclut « aucune »
    }
  };
  const toggleCreneau = (jour, creneau) =>
    setDispos((cur) => toggleDispo(cur, weekLabel(jour, creneau)));
  const toggleCreneauWeekend = (jour, creneau) =>
    setDispos((cur) => toggleDispo(cur, weekendLabel(jour, creneau)));
  const toggleAucune = () =>
    setDispos((cur) => {
      const next = toggleDispo(cur, DISPO_AUCUNE);
      if (next.includes(DISPO_AUCUNE)) setJoursOuverts([]); // exclusive : referme tout
      return next;
    });
  const dispoManquante = showDispo && dispos.length === 0;
  const formuleNom = tarif.niveau || tarif.titre;
  // Frais de dossier fixes, identiques pour tous les packs.
  const FRAIS_DOSSIER = 25;
  const prixNum = typeof tarif.prix === 'number' ? tarif.prix : null;
  const total = prixNum != null ? prixNum + FRAIS_DOSSIER : null;
  // Pack « sur mesure » (pas de prix fixe) : le besoin de l'enfant conditionne
  // l'accompagnement proposé → on invite la famille à le décrire ici.
  const showBesoin = prixNum == null;
  // Choix obligatoire (ex. Hizb à mémoriser) : plusieurs options équivalentes,
  // aucune par défaut — la famille doit trancher avant l'envoi.
  const choixOptions = Array.isArray(tarif.choix?.options) ? tarif.choix.options : [];
  const hasChoix = choixOptions.length > 0;
  const choixManquant = hasChoix && !choixSelected;

  // Étapes du parcours mobile (« wizard ») : Récap → Coordonnées → [Disponibilités]
  // → [Besoin]. Sans effet sur desktop, où tout reste toujours visible
  // (cf. parcours.css). `coordRef` permet de déclencher la validation native
  // du navigateur sur les champs de coordonnées avant de passer à la suite,
  // pendant qu'ils sont encore visibles (une fois l'étape quittée, un champ
  // requis resté invisible ne pourrait plus recevoir le focus du navigateur).
  const steps = ['recap', 'coordonnees', ...(showDispo ? ['dispo'] : []), ...(showBesoin ? ['besoin'] : [])];
  const [step, setStep] = useState(0);
  const stepKey = steps[step];
  const lastStep = steps.length - 1;
  const coordRef = useRef(null);
  const toTop = () => window.scrollTo({ top: 0 });

  const goNext = () => {
    if (stepKey === 'coordonnees') {
      if (hasChoix && !choixSelected) { setError('Choisissez une option.'); return; }
      const invalid = coordRef.current?.querySelector(':invalid');
      if (invalid) { invalid.reportValidity(); return; }
    }
    if (stepKey === 'dispo' && dispoManquante) {
      setError('Sélectionnez au moins une disponibilité.');
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, lastStep));
    toTop();
  };
  const goPrev = () => { setError(''); setStep((s) => Math.max(s - 1, 0)); toTop(); };
  // Entrée dans un champ texte = étape suivante (comme un vrai formulaire pas-à-pas),
  // sauf sur la dernière étape où Entrée doit envoyer normalement le formulaire.
  const onFormKeyDown = (e) => {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;
    if (step < lastStep) { e.preventDefault(); goNext(); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (choixManquant) {
      setError('Choisissez une option.');
      return;
    }
    if (dispoManquante) {
      setError('Sélectionnez au moins une disponibilité.');
      return;
    }
    setSending(true); setError('');
    try {
      const { eleve, contact } = splitIdentity(form, estEnfant);
      await submitPreinscription({
        type: 'tarif',
        path,
        formule: {
          nom: formuleNom,
          prix: typeof tarif.prix === 'number' ? tarif.prix : null,
          rythme: tarif.rythme || null,
        },
        disponibilites: dispos.length ? dispos : null,
        devis: (hasChoix || showBesoin)
          ? { sujet: hasChoix ? choixSelected : null, besoin: showBesoin ? (besoin.trim() || null) : null }
          : undefined,
        eleve, contact, estEnfant,
      });
      onSent({ choix: path.map((n) => n.label), coord: { prenom: contact.prenom } });
    } catch (err) {
      setError(err.message || "L’envoi a échoué, réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="recap parcours-anim">
      {/* Étapes (mobile uniquement) : invisible sur desktop, où tout reste affiché. */}
      <div className="wiz-progress">
        <p className="wiz-progress-label">Étape {step + 1} / {steps.length}</p>
        <div className="wiz-progress-track">
          <div className="wiz-progress-bar" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      {/* ─ Colonne résumé / pack ─ */}
      <aside className={`recap-summary wiz-step${stepKey === 'recap' ? ' is-active' : ''}`}>
        <div className="recap-eyebrow">Votre sélection</div>

        <nav className="recap-path">
          {path.map((n, i) => (
            <span className="recap-crumb" key={n.id}>
              {i > 0 && <span className="recap-sep">›</span>}
              {n.label}
            </span>
          ))}
        </nav>

        <div className="recap-formule">
          <span className="recap-formule-nom">{formuleNom}</span>
          {tarif.ar && <span className="recap-formule-ar">{tarif.ar}</span>}
        </div>
        {tarif.rythme && <p className="recap-rythme">{tarif.rythme}</p>}

        {Array.isArray(tarif.featureGroups) ? (
          tarif.featureGroups.map((g, gi) => (
            <div className="recap-feat-group" key={gi}>
              <span className="recap-feat-group-label">{g.titre}</span>
              <ul className="recap-feats">
                {g.items.map((f, i) => (
                  <li key={i}><span className="tarif-check" aria-hidden="true" />{f}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          tarif.features?.length > 0 && (
            <ul className="recap-feats">
              {tarif.features.map((f, i) => (
                <li key={i}><span className="tarif-check" aria-hidden="true" />{f}</li>
              ))}
            </ul>
          )
        )}

        <div className="recap-cost">
          {prixNum != null ? (
            <>
              <div className="recap-cost-row">
                <span>Prix du pack</span>
                <span>{prixNum} €</span>
              </div>
              <div className="recap-cost-row">
                <span>Frais de dossier</span>
                <span>{FRAIS_DOSSIER} €</span>
              </div>
              <div className="recap-total">
                <span className="recap-total-label">Total</span>
                <span className="recap-total-val">{total} €</span>
              </div>
            </>
          ) : (
            <>
              <div className="recap-cost-row">
                <span>Prix du pack</span>
                <span>{tarif.prixNote}</span>
              </div>
              <div className="recap-cost-row">
                <span>Frais de dossier</span>
                <span>{FRAIS_DOSSIER} €</span>
              </div>
              <div className="recap-total">
                <span className="recap-total-label">Tarif</span>
                <span className="recap-total-val">Sur devis</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ─ Colonne formulaire ─ */}
      <form className="recap-form" onSubmit={submit} onKeyDown={onFormKeyDown}>
        {hasChoix && (
          <fieldset className={`wiz-step recap-dispo${stepKey === 'coordonnees' ? ' is-active' : ''}`}>
            <legend className="recap-group-label">{tarif.choix.label || 'Choisissez une option'}</legend>
            <div className="recap-dispo-opts">
              {choixOptions.map((opt) => (
                <label
                  key={opt}
                  className={`recap-dispo-chip${choixSelected === opt ? ' is-on' : ''}`}
                >
                  <input
                    type="radio"
                    name="choix"
                    checked={choixSelected === opt}
                    onChange={() => setChoixSelected(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Adulte : coordonnées et disponibilités côte à côte (les deux sont
            courtes). Enfant : coordonnées déjà scindées enfant/parent en
            interne (CoordonneesFields) → disponibilités pleine largeur en
            dessous plutôt qu'un 3e niveau de colonnes. */}
        <div className={splitFormCols ? 'recap-form-cols' : undefined}>
          <div
            ref={coordRef}
            className={`wiz-step${splitFormCols ? ' recap-form-col' : ''}${stepKey === 'coordonnees' ? ' is-active' : ''}`}
          >
            <div className="recap-eyebrow">Vos coordonnées</div>

            <CoordonneesFields estEnfant={estEnfant} form={form} onChange={change} idPrefix="r" />
          </div>

          {showDispo && (
            <fieldset className={`wiz-step recap-dispo${splitFormCols ? ' recap-form-col' : ' recap-dispo-standalone'}${stepKey === 'dispo' ? ' is-active' : ''}`}>
              <legend className="recap-eyebrow">Vos disponibilités</legend>
              <p className="recap-dispo-help">
                Choisir un ou plusieurs créneaux ou aucune préférence.
              </p>

              <label
                className={`recap-dispo-chip recap-dispo-none${dispos.includes(DISPO_AUCUNE) ? ' is-on' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={dispos.includes(DISPO_AUCUNE)}
                  onChange={toggleAucune}
                />
                {DISPO_AUCUNE}
              </label>

              {/* En semaine : jour → créneaux révélés */}
              <div className="recap-dispo-group">
                <p className="recap-dispo-titre">En semaine</p>
                <div className="recap-dispo-days">
                  {DISPO_JOURS_SEMAINE.map((jour) => (
                    <label
                      key={jour}
                      className={`recap-dispo-chip${joursOuverts.includes(jour) ? ' is-on' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={joursOuverts.includes(jour)}
                        onChange={() => toggleJour(jour)}
                      />
                      {jour}
                    </label>
                  ))}
                </div>

                {DISPO_JOURS_SEMAINE.filter((j) => joursOuverts.includes(j)).map((jour) => (
                  <div className="recap-dispo-jour" key={jour}>
                    <p className="recap-dispo-jour-label">{jour}</p>
                    <div className="recap-dispo-opts">
                      {creneauxSemaine.map((creneau) => {
                        const label = weekLabel(jour, creneau);
                        return (
                          <label
                            key={creneau}
                            className={`recap-dispo-chip${dispos.includes(label) ? ' is-on' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={dispos.includes(label)}
                              onChange={() => toggleCreneau(jour, creneau)}
                            />
                            {creneau}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Le week-end : jour → créneaux révélés */}
              <div className="recap-dispo-group">
                <p className="recap-dispo-titre">Le week-end</p>
                <div className="recap-dispo-days">
                  {DISPO_WEEKEND_JOURS.map(({ jour }) => (
                    <label
                      key={jour}
                      className={`recap-dispo-chip${joursOuverts.includes(jour) ? ' is-on' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={joursOuverts.includes(jour)}
                        onChange={() => toggleJour(jour)}
                      />
                      {jour}
                    </label>
                  ))}
                </div>

                {DISPO_WEEKEND_JOURS.filter(({ jour }) => joursOuverts.includes(jour)).map(
                  ({ jour, creneaux }) => (
                    <div className="recap-dispo-jour" key={jour}>
                      <p className="recap-dispo-jour-label">{jour}</p>
                      <div className="recap-dispo-opts">
                        {creneaux.map((creneau) => {
                          const label = weekendLabel(jour, creneau);
                          return (
                            <label
                              key={creneau}
                              className={`recap-dispo-chip${dispos.includes(label) ? ' is-on' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={dispos.includes(label)}
                                onChange={() => toggleCreneauWeekend(jour, creneau)}
                              />
                              {creneau}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </fieldset>
          )}
        </div>

        {showBesoin && (
          <div className={`wiz-step recap-field${stepKey === 'besoin' ? ' is-active' : ''}`}>
            <p className="recap-group-label">Discutons ensemble</p>
            <label htmlFor="r-besoin">Décrivez les besoins de votre enfant</label>
            <textarea
              id="r-besoin"
              name="besoin"
              rows={4}
              value={besoin}
              onChange={(e) => setBesoin(e.target.value)}
              placeholder="Diagnostic, difficultés rencontrées, aménagements utiles, objectifs souhaités…"
            />
          </div>
        )}

        {error && <p className="recap-error">{error}</p>}

        {/* Navigation d'étapes (mobile uniquement) */}
        <div className="wiz-nav">
          {step > 0 && (
            <button type="button" className="wiz-nav-btn wiz-nav-prev" onClick={goPrev}>
              <span aria-hidden="true">←</span> Précédent
            </button>
          )}
          {step < lastStep && (
            <button type="button" className="wiz-nav-btn wiz-nav-next" onClick={goNext}>
              Suivant <span aria-hidden="true">→</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          className={`recap-send wiz-send${step === lastStep ? ' is-active' : ''}`}
          disabled={sending || dispoManquante || choixManquant}
          onMouseEnter={btnEnter} onMouseLeave={btnLeave}
        >
          {sending ? 'Envoi…' : 'Envoyer ma demande'}
          {!sending && <span className="recap-send-arrow" aria-hidden="true">→</span>}
        </button>
      </form>
    </div>
  );
}
