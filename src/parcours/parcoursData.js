// ─────────────────────────────────────────────────────────────────────────────
//  ARBORESCENCE DU PARCOURS (déclarative)
// ─────────────────────────────────────────────────────────────────────────────
//  Toute la navigation par stickers est décrite ICI, sous forme de données.
//  Ajouter un sticker = ajouter un nœud. Aucun composant à modifier.
//
//  Nœud de catégorie :
//    { id, label, ar?, ico, desc?, disabled?, children?:[...], tarifs?:[...], devis? }
//    → un nœud "feuille" porte `tarifs` (et `meta?`, `adhesion?`),
//      ou `devis: true` pour mener à un formulaire de devis sur mesure.
//
//  Tarif (une formule) :
//    { id, titre, niveau?, ar?, prix(number|null), prixNote?, rythme?,
//      features?:string[], note? }
//
//  Données issues de la maquette de Sofiane (niveau Adulte).
//  Les branches Enfant / Soutien scolaire / Social restent à dérouler.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Langue arabe — Adulte ───
const TARIFS_ARABE = [
  {
    id: 'ar-debutant',
    titre: 'Je pars de zéro',
    niveau: 'Débutant — Alphabet',
    ar: 'مبتدئ',
    prix: 149,
    rythme: '20 séances · 40 min / séance',
    features: [
      "Apprentissage de l’alphabet arabe",
      'Lecture des lettres isolées & liées',
      'Premiers mots du vocabulaire courant',
      'Exercices écrits & oraux',
      'Support de cours inclus',
    ],
  },
  {
    id: 'ar-intermediaire',
    titre: "Je connais l’alphabet par cœur et je déchiffre des mots",
    niveau: 'Intermédiaire — Lecture',
    ar: 'متوسط',
    prix: 149,
    rythme: '20 séances · 40 min / séance',
    features: [
      'Lecture fluide de textes simples',
      'Introduction à la grammaire arabe',
      'Conjugaison des verbes courants',
      'Expression orale guidée',
      'Accès à la plateforme en ligne',
    ],
  },
  {
    id: 'ar-avance',
    titre: 'Je sais lire sans bégayer',
    niveau: 'Avancé — Expression',
    ar: 'متقدم',
    prix: 149,
    rythme: '20 séances · 40 min / séance',
    features: [
      'Grammaire & syntaxe approfondies',
      'Rédaction en arabe classique',
      'Littérature & textes authentiques',
      'Expression orale avancée',
      'Suivi personnalisé mensuel',
    ],
  },
];

// ─── Coran — Adulte ───
const TARIFS_CORAN = [
  {
    id: 'co-debutant',
    titre: "Je ne sais pas lire — j’apprends à lire le Coran",
    niveau: 'Débutant — Alphabet',
    prix: 149,
    rythme: '20 séances · 40 min / séance',
    features: [
      'Apprentissage des lettres arabes',
      'Maîtrise des voyelles',
      'Assemblage progressif des lettres',
      'Application des règles de tajwid',
    ],
  },
  {
    id: 'co-regles',
    titre: 'Je sais lire, je veux apprendre les règles',
    prix: 149,
    rythme: '15 séances · 40 min / séance',
    features: [
      'Apprentissage des règles de tajwid',
      'Ghunna, Idgham, Iqlab, Idhar',
      'Application pratique dans la lecture du Coran',
    ],
  },
  {
    id: 'co-sourates',
    titre: "J’apprends des sourates",
    niveau: 'Différent groupe',
    prix: null,
    prixNote: 'Sur demande', // ⚠️ aucun prix sur la maquette — à confirmer
    features: ['Juzz ’Amma', 'Yâsîn'],
  },
  {
    id: 'co-correction',
    titre: "Je veux que l’on me corrige mes sourates",
    prix: 49,
    rythme: 'Cours particuliers · 5 séances',
    features: [
      "Récitation devant l’enseignant",
      'Correction de la prononciation',
      'Bonne articulation des lettres',
      'Respect des règles de Tajwid',
    ],
    note: 'Prérequis : savoir lire + connaître les règles de tajwid',
  },
];

// ─── Éducation islamique (EDI) — Adulte ───
const TARIFS_EDI = [
  {
    id: 'edi-sira',
    titre: 'Sira',
    prix: 99,
    rythme: '15 séances · 40 min / séance',
    features: [
      'Découverte de la vie du Prophète',
      "Compréhension d’événements marquants",
      'Étude de son comportement',
      'Mise en pratique des enseignements',
    ],
  },
  {
    id: 'edi-fiqh',
    titre: 'Fiqh — Prière',
    prix: 99,
    rythme: '15 séances · 40 min / séance',
    features: [
      'Conditions de la prière',
      'Piliers de la prière',
      'Obligations et actes recommandés',
      'Erreurs et corrections de la prière',
    ],
  },
  {
    id: 'edi-hajj',
    titre: 'Les rites du pèlerinage',
    prix: 99,
    rythme: '15 séances · 40 min / séance',
    features: ['Conditions du pèlerinage', 'Les étapes des rites'],
  },
  {
    id: 'edi-lavage',
    titre: 'Lavage mortuaire',
    prix: 99,
    rythme: '15 séances · 40 min / séance',
    features: [],
  },
  {
    id: 'edi-zakat',
    titre: 'Zakat',
    prix: 99,
    rythme: '15 séances · 40 min / séance',
    features: [],
  },
];

// ─── Enfant · Autonomie · Arabe ───
const TARIFS_ARABE_ENFANT = [
  {
    id: 'enf-ar-mod1',
    niveau: 'Module 1',
    titre: 'Débutant — Alphabet',
    prix: 90,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [
      'Apprentissage de l’alphabet arabe',
      'Lecture des lettres isolées & liées',
      'Premiers mots du vocabulaire courant',
      'Exercices écrits & oraux',
      'Support de cours inclus',
    ],
  },
  {
    id: 'enf-ar-mod2',
    niveau: 'Module 2',
    titre: 'Intermédiaire — Lecture',
    prix: 90,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [
      'Lecture fluide de textes simples',
      'Introduction à la grammaire arabe',
      'Conjugaison des verbes courants',
      'Expression orale guidée',
      'Accès à la plateforme en ligne',
    ],
  },
  {
    id: 'enf-ar-mod3',
    niveau: 'Module 3',
    titre: 'Avancé — Expression',
    prix: 90,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [
      'Grammaire & syntaxe approfondies',
      'Rédaction en arabe classique',
      'Littérature & textes authentiques',
      'Expression orale avancée',
      'Suivi personnalisé mensuel',
    ],
  },
];

// ─── Enfant · Autonomie · Éducation islamique ───
// ⚠️ « cf programme N1 » = placeholder de la maquette, à remplacer par les vrais points.
const TARIFS_EDI_ENFANT = [
  {
    id: 'enf-edi-mod1',
    titre: 'Module 1',
    prix: 90,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N1',
  },
  {
    id: 'enf-edi-mod2',
    titre: 'Module 2',
    prix: 90,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N1',
  },
  {
    id: 'enf-edi-mod3',
    titre: 'Module 3',
    prix: 90,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N1',
  },
];

// ─── Enfant · Autonomie · Coran ───
const TARIFS_CORAN_ENFANT = [
  {
    id: 'enf-co-lire',
    titre: 'J’apprends à lire le Coran — je ne sais pas lire',
    prix: 90,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
  },
  {
    id: 'enf-co-regles',
    titre: 'Je sais lire, je veux apprendre les règles',
    prix: 90,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
  },
  {
    id: 'enf-co-correction',
    titre: 'Je veux que l’on me corrige mes sourates',
    prix: 90,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
  },
];

// ─── Enfant · Autonomie · Coran & Éducation islamique (combinée) ───
// ⚠️ « cf programme Nx » = placeholder de la maquette, à remplacer par les vrais points.
const TARIFS_COMBO_ENFANT = [
  {
    id: 'enf-combo-mod1',
    titre: 'Module 1',
    prix: 149,
    rythme: '2 × 40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N1',
  },
  {
    id: 'enf-combo-mod2',
    titre: 'Module 2',
    prix: 149,
    rythme: '2 × 40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N2',
  },
  {
    id: 'enf-combo-mod3',
    titre: 'Module 3',
    prix: 149,
    rythme: '2 × 40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N3',
  },
];

// ─── Enfant · Visioconférence · Arabe (mêmes contenus que l'Autonomie, prix 190 €) ───
const TARIFS_ARABE_ENFANT_VISIO = [
  {
    id: 'enf-ar-visio-mod1',
    niveau: 'Module 1',
    titre: 'Débutant — Alphabet',
    prix: 190,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [
      'Apprentissage de l’alphabet arabe',
      'Lecture des lettres isolées & liées',
      'Premiers mots du vocabulaire courant',
      'Exercices écrits & oraux',
      'Support de cours inclus',
    ],
  },
  {
    id: 'enf-ar-visio-mod2',
    niveau: 'Module 2',
    titre: 'Intermédiaire — Lecture',
    prix: 190,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [
      'Lecture fluide de textes simples',
      'Introduction à la grammaire arabe',
      'Conjugaison des verbes courants',
      'Expression orale guidée',
      'Accès à la plateforme en ligne',
    ],
  },
  {
    id: 'enf-ar-visio-mod3',
    niveau: 'Module 3',
    titre: 'Avancé — Expression',
    prix: 190,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [
      'Grammaire & syntaxe approfondies',
      'Rédaction en arabe classique',
      'Littérature & textes authentiques',
      'Expression orale avancée',
      'Suivi personnalisé mensuel',
    ],
  },
];

// ─── Enfant · Visioconférence · Éducation islamique (prix 190 €) ───
// ⚠️ « cf programme N1 » = placeholder de la maquette, à remplacer par les vrais points.
const TARIFS_EDI_ENFANT_VISIO = [
  {
    id: 'enf-edi-visio-mod1',
    titre: 'Module 1',
    prix: 190,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N1',
  },
  {
    id: 'enf-edi-visio-mod2',
    titre: 'Module 2',
    prix: 190,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N1',
  },
  {
    id: 'enf-edi-visio-mod3',
    titre: 'Module 3',
    prix: 190,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N1',
  },
];

// ─── Enfant · Visioconférence · Coran (prix 190 €) ───
const TARIFS_CORAN_ENFANT_VISIO = [
  {
    id: 'enf-co-visio-lire',
    titre: 'J’apprends à lire le Coran — je ne sais pas lire',
    prix: 190,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
  },
  {
    id: 'enf-co-visio-regles',
    titre: 'Je sais lire, je veux apprendre les règles',
    prix: 190,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
  },
  {
    id: 'enf-co-visio-correction',
    titre: 'Je veux que l’on me corrige mes sourates',
    prix: 190,
    rythme: '40 min / semaine · jusqu’à fin du module',
    features: [],
  },
];

// ─── Enfant · Visioconférence · Coran & Éducation islamique (prix 290 €) ───
// ⚠️ « cf programme Nx » = placeholder de la maquette, à remplacer par les vrais points.
const TARIFS_COMBO_ENFANT_VISIO = [
  {
    id: 'enf-combo-visio-mod1',
    titre: 'Module 1',
    prix: 290,
    rythme: '2 × 40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N1',
  },
  {
    id: 'enf-combo-visio-mod2',
    titre: 'Module 2',
    prix: 290,
    rythme: '2 × 40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N2',
  },
  {
    id: 'enf-combo-visio-mod3',
    titre: 'Module 3',
    prix: 290,
    rythme: '2 × 40 min / semaine · jusqu’à fin du module',
    features: [],
    note: 'cf programme N3',
  },
];

export const PARCOURS = {
  id: 'root',
  children: [
    {
      id: 'enseignement-religieux',
      label: 'Enseignement religieux',
      ar: 'العلوم الدينية',
      ico: 'ق',
      desc: 'Arabe, Coran et éducation islamique, pour adultes et enfants.',
      children: [
        {
          id: 'adulte',
          label: 'Adulte',
          ar: 'الكبار',
          ico: 'ك',
          desc: 'Formations destinées aux adultes.',
          children: [
            {
              id: 'arabe',
              label: 'Langue arabe',
              ar: 'اللغة العربية',
              ico: 'ع',
              desc: 'Apprentissage de la langue arabe.',
              meta: '2 à 3 sessions dans l’année · max 10 / groupe',
              adhesion: '25 € d’adhésion',
              tarifs: TARIFS_ARABE,
            },
            {
              id: 'coran',
              label: 'Coran',
              ar: 'القرآن الكريم',
              ico: 'ق',
              desc: 'Lecture, Tajwid et mémorisation.',
              tarifs: TARIFS_CORAN,
            },
            {
              id: 'education-islamique',
              label: 'Éducation islamique',
              ar: 'التربية الإسلامية',
              ico: 'إ',
              desc: 'Différents modules de sciences islamiques.',
              meta: 'Différents modules',
              adhesion: '25 € d’adhésion',
              tarifs: TARIFS_EDI,
            },
          ],
        },
        {
          id: 'enfant',
          label: 'Enfant',
          ar: 'الأطفال',
          ico: 'ط',
          desc: 'Formations destinées aux enfants.',
          children: [
            {
              id: 'enfant-autonomie',
              label: 'Autonomie',
              ico: 'س',
              desc: "L’enfant apprend en autonomie.",
              children: [
                {
                  id: 'enfant-auto-coran',
                  label: 'Coran',
                  ar: 'القرآن الكريم',
                  ico: 'ق',
                  desc: 'Lecture, Tajwid et mémorisation.',
                  tarifs: TARIFS_CORAN_ENFANT,
                },
                {
                  id: 'enfant-auto-edi',
                  label: 'Éducation islamique',
                  ar: 'التربية الإسلامية',
                  ico: 'إ',
                  desc: 'Modules de sciences islamiques.',
                  tarifs: TARIFS_EDI_ENFANT,
                },
                {
                  id: 'enfant-auto-arabe',
                  label: 'Arabe',
                  ar: 'اللغة العربية',
                  ico: 'ع',
                  desc: 'Apprentissage de la langue arabe.',
                  tarifs: TARIFS_ARABE_ENFANT,
                },
                {
                  id: 'enfant-auto-combo',
                  label: 'Coran & Éducation islamique',
                  ico: 'ج',
                  desc: 'Formule combinée Coran et éducation islamique.',
                  tarifs: TARIFS_COMBO_ENFANT,
                },
              ],
            },
            {
              id: 'enfant-visio',
              label: 'Visioconférence',
              ico: 'ر',
              desc: 'Cours en visioconférence.',
              children: [
                {
                  id: 'enfant-visio-coran',
                  label: 'Coran',
                  ar: 'القرآن الكريم',
                  ico: 'ق',
                  desc: 'Lecture, Tajwid et mémorisation.',
                  tarifs: TARIFS_CORAN_ENFANT_VISIO,
                },
                {
                  id: 'enfant-visio-edi',
                  label: 'Éducation islamique',
                  ar: 'التربية الإسلامية',
                  ico: 'إ',
                  desc: 'Modules de sciences islamiques.',
                  tarifs: TARIFS_EDI_ENFANT_VISIO,
                },
                {
                  id: 'enfant-visio-arabe',
                  label: 'Arabe',
                  ar: 'اللغة العربية',
                  ico: 'ع',
                  desc: 'Apprentissage de la langue arabe.',
                  tarifs: TARIFS_ARABE_ENFANT_VISIO,
                },
                {
                  id: 'enfant-visio-combo',
                  label: 'Coran & Éducation islamique',
                  ico: 'ج',
                  desc: 'Formule combinée Coran et éducation islamique.',
                  tarifs: TARIFS_COMBO_ENFANT_VISIO,
                },
                {
                  id: 'enfant-visio-accompagnement',
                  label: 'Accompagnement spécifique',
                  ico: 'ص',
                  desc: 'Thématiques spécifiques à choisir.',
                  // Stickers désactivés pour l'instant (pas de suite / tarifs à venir).
                  // Rythmes prévus (maquette) : à brancher plus tard.
                  children: [
                    { id: 'enfant-visio-acc-priere', label: 'Prière et ablution', ico: 'ص', disabled: true }, // 30 min/sem · 5 séances
                    { id: 'enfant-visio-acc-sira', label: 'Sira', ico: 'س', disabled: true }, // 30 min/sem · 10 séances
                    { id: 'enfant-visio-acc-seigneur', label: 'Mon Seigneur', ico: 'ر', disabled: true }, // 30 min/sem · 5 séances
                    { id: 'enfant-visio-acc-adam', label: 'Adam', ico: 'أ', disabled: true }, // 20 min/sem · 5 séances
                    { id: 'enfant-visio-acc-nouh', label: 'Nouh', ico: 'ن', disabled: true }, // 20 min/sem · 5 séances
                    { id: 'enfant-visio-acc-souleyman', label: 'Souleyman', ico: 'ل', disabled: true }, // 20 min/sem · 5 séances
                    { id: 'enfant-visio-acc-ibrahim', label: 'Ibrahim', ico: 'ب', disabled: true }, // 20 min/sem · 5 séances
                  ],
                },
              ],
            },
            {
              id: 'enfant-particulier',
              label: 'Cours particulier',
              ico: 'خ',
              desc: 'Cours particuliers individuels.',
              children: [
                {
                  id: 'enfant-particulier-devis',
                  label: 'Devis personnalisé',
                  ico: 'ط',
                  desc: 'Décrivez votre besoin, nous vous recontactons avec une proposition.',
                  devis: true, // ⇒ mène à un formulaire de devis (DevisStep), pas à des tarifs
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'soutien-scolaire',
      label: 'Soutien scolaire académique',
      ar: 'الدعم المدرسي',
      ico: 'م',
      desc: "Accompagnement scolaire dans les matières de l’éducation nationale.",
      disabled: true, // ⏳ à dérouler plus tard
    },
    {
      id: 'social',
      label: 'Social',
      ar: 'الخدمات الاجتماعية',
      ico: 'خ',
      desc: "Petites annonces : garde d’enfants, aide aux personnes âgées.",
      disabled: true, // ⏳ à dérouler plus tard
    },
  ],
};
