// ─────────────────────────────────────────────────────────────────────────────
//  ARBORESCENCE DU PARCOURS (déclarative)
// ─────────────────────────────────────────────────────────────────────────────
//  Toute la navigation par stickers est décrite ICI, sous forme de données.
//  Ajouter un sticker = ajouter un nœud. Aucun composant à modifier.
//
//  Nœud de catégorie :
//    { id, label, ar?, ico, desc?, disabled?, children?:[...], tarifs?:[...], devis? }
//    → un nœud "feuille" porte `tarifs` (et `meta?`),
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
    id: "ar-mod1",
    niveau: "Débutant",
    prereq: "Je pars de zéro 😄",
    prereqNone: true,
    prix: 149,
    rythme: "20 séances · 40 min / semaine",
    features: [
      "Lecture de la lettre au mot",
      "Découverte de l’écriture",
      "Vocabulaire et expression du quotidien",
      "Découverte expression orale",
    ],
  },
  {
    id: "ar-mod2",
    niveau: "Intermédiaire",
    prereq: "Je connais l’alphabet par cœur et je déchiffre des mots",
    prix: 149,
    rythme: "20 séances · 40 min / semaine",
    features: [
      "Lecture",
      "Vocabulaire du quotidien",
      "Expression orale",
      "Initiation à la grammaire",
    ],
  },
  {
    id: "ar-mod3",
    niveau: "Avancé",
    prereq: "Je sais lire sans bégayer 😉",
    prix: 149,
    rythme: "20 séances · 40 min / semaine",
    features: [
      "Fluidification de la lecture",
      "Texte et dialogue",
      "Initiation à la compréhension",
      "Grammaire arabe",
      "Expression orale",
    ],
  },
  {
    id: "ar-mod4",
    niveau: "Expert",
    prereq: "J’ai une lecture fluide et je comprends globalement ce que je lis",
    prix: 149,
    rythme: "20 séances · 40 min / semaine",
    features: [
      "Lecture sans vocalisation",
      "Perfectionnement de l’expression orale",
      "Approfondissement de la grammaire",
    ],
  },
];

// ─── Coran — Adulte · sous-packs « J'apprends des sourates » ───
// ⚠️ Prix et contenus à définir — placeholders « Sur demande » pour l'instant.
const TARIFS_CORAN_SOURATES = [
  {
    id: 'co-sourate-hizb-sabih',
    niveau: 'Hizb Sabih',
    prix: 90,
    rythme: '20 séances · 2 × 40 min / semaine',
    features: [],
  },
  {
    id: 'co-sourate-tariq-naba',
    niveau: 'Hizb de At-Tariq à An-Naba',
    prix: 90,
    rythme: '20 séances · 2 × 40 min / semaine',
    features: [],
  },
  {
    id: 'co-sourate-al-mulk',
    niveau: 'Sourate Al-Mulk',
    prix: 90,
    rythme: '7 séances · 40 min / semaine',
    features: [],
  },
  {
    id: 'co-sourate-yasin',
    niveau: 'Sourate Yâsîn',
    prix: 90,
    rythme: '16 séances · 40 min / semaine',
    features: [],
  },
  {
    id: 'co-sourate-baqara',
    niveau: 'Hizb Al-Baqara',
    cadence: '½ page / séance',
    prix: 90,
    rythme: '24 séances · 2 × 40 min / semaine',
    features: [],
  },
  {
    id: 'co-sourate-baqara-2',
    niveau: 'Hizb Al-Baqara',
    cadence: '1 page / séance',
    prix: 90,
    rythme: '14 séances · 40 min / semaine',
    features: [],
  },
];

// ─── Coran — Adulte ───
const TARIFS_CORAN = [
  {
    id: 'co-debutant',
    niveau: "J'apprends à lire le Coran",
    prereq: "Je pars de zéro 😄",
    prereqNone: true,
    prix: 149,
    rythme: '16 séances · 2 × 40 min / semaine',
    features: [
      'Apprentissage des lettres arabes',
      'Maîtrise des voyelles',
      'Assemblage progressif des lettres',
      'Application des règles de tajwid',
    ],
  },
  {
    id: 'co-regles',
    niveau: "J'apprends les règles de Tajwid",
    prereq: "Je sais lire",
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
    niveau: "J'apprends des sourates",
    prereq: "Je sais lire et je connais les règles de Tajwid",
    tarifs: TARIFS_CORAN_SOURATES, // carte-groupe → ouvre un sous-écran de tarifs
  },
  {
    id: 'co-correction',
    niveau: "Je me fais corriger",
    prereq: "Je sais lire, je connais les règles et j'apprends seul mon Coran",
    prix: 69,
    rythme: 'Cours particuliers · 5 séances',
    features: [
      "Récitation devant l’enseignant",
      'Correction de la prononciation',
      'Bonne articulation des lettres',
      'Respect des règles de Tajwid',
    ],
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
    titre: 'Fiqh Salat',
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
    titre: 'Fiqh du Pèlerinage',
    prix: 99,
    rythme: '15 séances · 40 min / séance',
    features: ['Conditions du pèlerinage', 'Les étapes des rites'],
  },
  {
    id: 'edi-lavage',
    titre: 'Lavage mortuaire',
    prix: 49,
    rythme: '5 séances · 40 min / séance',
    features: [
      'Fondement religieux',
      'Rite funéraire',
      'Respect du défunt',
      'Préparation funéraire',
    ],
  },
  {
    id: 'edi-zakat',
    titre: 'Fiqh de la Zakat',
    prix: 99,
    rythme: '15 séances · 40 min / séance',
    features: [
      'Conditions et obligation de la Zakat',
      'Biens soumis à la Zakat et calcul',
      'Bénéficiaires de la Zakat',
    ],
  },
];

// ─── Enfant · Autonomie · Arabe ───
const TARIFS_ARABE_ENFANT = [
  {
    id: 'enf-ar-mod1',
    niveau: 'Débutant',
    prereq: 'Je pars de zéro 😄',
    prereqNone: true,
    prix: 99,
    rythme: 'Accès jusqu’à fin du module',
    features: [
      'Lecture de la lettre au mot',
      'Découverte de l’écriture',
      'Vocabulaire du quotidien',
      'Découverte expression orale',
    ],
  },
  {
    id: 'enf-ar-mod2',
    niveau: 'Intermédiaire',
    prereq: "Je connais l'alphabet par cœur et je déchiffre des mots",
    prix: 99,
    rythme: 'Accès jusqu’à fin du module',
    features: [
      'Lecture du mot à la phrase',
      'Attachement des lettres',
      'Vocabulaire du quotidien',
      'Expression orale',
    ],
  },
  {
    id: 'enf-ar-mod3',
    niveau: 'Avancé',
    prereq: 'Je sais lire sans bégayer 😉',
    prix: 99,
    rythme: 'Accès jusqu’à fin du module',
    features: [
      'Fluidification de la lecture',
      'Initiation à la compréhension',
      'L’article solaire et lunaire',
      'Vocabulaire et expression orale',
    ],
  },
];

// ─── Enfant · Autonomie · Éducation islamique ───
const TARIFS_EDI_ENFANT = [
  {
    id: 'enf-edi-mod1',
    titre: 'Module 1',
    prix: 99,
    rythme: 'Accès jusqu’à fin du module',
    features: [
      'Connaître Allah ﷻ et l’attestation de Foi',
      'Découvrir le Prophète Mohammed ﷺ et les premiers chapitres de son histoire',
      'Apprendre les piliers de l’Islam et les invocations de base',
      'Développer les bonnes valeurs : le respect, la propreté, les bonnes manières…',
      'Initiation aux ablutions et à la prière',
    ],
  },
  {
    id: 'enf-edi-mod2',
    titre: 'Module 2',
    prix: 99,
    rythme: 'Accès jusqu’à fin du module',
    features: [
      'Comprendre l’unicité d’Allah ﷻ et son adoration',
      'La vie du Prophète ﷺ, son enfance et son entourage',
      'Apprentissage étapes des ablutions',
      'Première partie sur la prière',
      'Développement des qualités du musulman : les bonnes manières, le partage, la vérité…',
    ],
  },
  {
    id: 'enf-edi-mod3',
    titre: 'Module 3',
    prix: 99,
    rythme: 'Accès jusqu’à fin du module',
    features: [
      'La Foi en Allah ﷻ : les piliers de la Foi',
      'L’importance de l’invocation',
      'Les grandes étapes de la vie du Prophète ﷺ, de la révélation à la Hijra à Médine',
      'La pratique religieuse : les étapes de la prière',
      'Le bon comportement : le droit des parents, la belle parole…',
    ],
  },
];

// ─── Enfant · Autonomie · Coran ───
const TARIFS_CORAN_ENFANT = [
  {
    id: 'enf-co-lire',
    titre: 'Les clés de la lecture',
    prix: 99,
    rythme: 'Accès jusqu’à fin du module',
    features: [
      'Prononciation correcte des lettres',
      'Découverte des outils de lecture',
      'Lecture des mots du Coran',
      'Découverte des sourates : Fatiha, Nass, Falaq, Ikhlass',
    ],
  },
  {
    id: 'enf-co-regles',
    titre: 'Les secrets du Tajwid',
    prix: 99,
    rythme: 'Accès jusqu’à fin du module',
    features: [
      'Découverte et application de mes premières règles de Tajwid',
      'Lecture du Coran',
      'Apprentissage de sourate Al Masad jusqu’à sourate Quraysh et de leurs enseignements',
    ],
  },
  {
    id: 'enf-co-correction',
    titre: 'Perfectionnement de la lecture',
    prix: 99,
    rythme: 'Accès jusqu’à fin du module',
    features: [
      'Perfectionnement des premières règles de Tajwid',
      'Apprendre à lire de façon fluide et progressive',
      'Apprentissage de sourate Al Fil à sourate Al Qadr et leurs enseignements',
    ],
  },
];

// ─── Enfant · Autonomie · Coran & Éducation islamique (combinée) ───
const TARIFS_COMBO_ENFANT = [
  {
    id: 'enf-combo-mod1',
    titre: 'Module 1',
    prix: 149,
    rythme: 'Accès jusqu’à fin du module',
    featureGroups: [
      {
        titre: 'Partie Coran',
        items: [
          'Prononciation correcte des lettres',
          'Découverte des outils de lecture',
          'Lecture des mots du Coran',
          'Découverte des sourates : Fatiha, Nass, Falaq, Ikhlass',
        ],
      },
      {
        titre: 'Partie Éducation islamique',
        items: [
          'Connaître Allah ﷻ et l’attestation de Foi',
          'Découvrir le Prophète Mohammed ﷺ et les premiers chapitres de son histoire',
          'Apprendre les piliers de l’Islam et les invocations de base',
          'Développer les bonnes valeurs : le respect, la propreté, les bonnes manières…',
          'Initiation aux ablutions et à la prière',
        ],
      },
    ],
  },
  {
    id: 'enf-combo-mod2',
    titre: 'Module 2',
    prix: 149,
    rythme: 'Accès jusqu’à fin du module',
    featureGroups: [
      {
        titre: 'Partie Coran',
        items: [
          'Découverte et application de mes premières règles de Tajwid',
          'Lecture du Coran',
          'Apprentissage de sourate Al Masad jusqu’à sourate Quraysh et de leurs enseignements',
        ],
      },
      {
        titre: 'Partie Éducation islamique',
        items: [
          'Comprendre l’unicité d’Allah ﷻ et son adoration',
          'La vie du Prophète ﷺ, son enfance et son entourage',
          'Apprentissage étapes des ablutions',
          'Première partie sur la prière',
          'Développement des qualités du musulman : les bonnes manières, le partage, la vérité…',
        ],
      },
    ],
  },
  {
    id: 'enf-combo-mod3',
    titre: 'Module 3',
    prix: 149,
    rythme: 'Accès jusqu’à fin du module',
    featureGroups: [
      {
        titre: 'Partie Coran',
        items: [
          'Perfectionnement des premières règles de Tajwid',
          'Apprendre à lire de façon fluide et progressive',
        ],
      },
      {
        titre: 'Partie Éducation islamique',
        items: [
          'La Foi en Allah ﷻ : les piliers de la Foi',
          'L’importance de l’invocation',
          'Les grandes étapes de la vie du Prophète ﷺ, de la révélation à la Hijra à Médine',
          'La pratique religieuse : les étapes de la prière',
          'Le bon comportement : le droit des parents, la belle parole…',
        ],
      },
    ],
  },
];

// ─── Enfant · Visioconférence · Arabe (mêmes contenus que l'Autonomie, prix 190 €) ───
const TARIFS_ARABE_ENFANT_VISIO = [
  {
    id: 'enf-ar-visio-mod1',
    niveau: 'Débutant',
    prereq: 'Je pars de zéro 😄',
    prereqNone: true,
    prix: 190,
    rythme: '25 séances · 2 × 40 min / semaine',
    features: [
      'Lecture de la lettre au mot',
      'Découverte de l’écriture',
      'Vocabulaire du quotidien',
      'Découverte expression orale',
    ],
  },
  {
    id: 'enf-ar-visio-mod2',
    niveau: 'Intermédiaire',
    prereq: "Je connais l'alphabet par cœur et je déchiffre des mots",
    prix: 190,
    rythme: '25 séances · 2 × 40 min / semaine',
    features: [
      'Lecture du mot à la phrase',
      'Attachement des lettres',
      'Vocabulaire du quotidien',
      'Expression orale',
    ],
  },
  {
    id: 'enf-ar-visio-mod3',
    niveau: 'Avancé',
    prereq: 'Je sais lire sans bégayer 😉',
    prix: 190,
    rythme: '25 séances · 2 × 40 min / semaine',
    features: [
      'Fluidification de la lecture',
      'Initiation à la compréhension',
      'L’article solaire et lunaire',
      'Vocabulaire et expression orale',
    ],
  },
];

// ─── Enfant · Visioconférence · Éducation islamique (prix 190 €) ───
const TARIFS_EDI_ENFANT_VISIO = [
  {
    id: 'enf-edi-visio-mod1',
    titre: 'Module 1',
    prix: 190,
    rythme: '25 séances · 40 min / semaine',
    features: [
      'Connaître Allah ﷻ et l’attestation de Foi',
      'Découvrir le Prophète Mohammed ﷺ et les premiers chapitres de son histoire',
      'Apprendre les piliers de l’Islam et les invocations de base',
      'Développer les bonnes valeurs : le respect, la propreté, les bonnes manières…',
      'Initiation aux ablutions et à la prière',
    ],
  },
  {
    id: 'enf-edi-visio-mod2',
    titre: 'Module 2',
    prix: 190,
    rythme: '20 séances · 40 min / semaine',
    features: [
      'Comprendre l’unicité d’Allah ﷻ et son adoration',
      'La vie du Prophète ﷺ, son enfance et son entourage',
      'Apprentissage étapes des ablutions',
      'Première partie sur la prière',
      'Développement des qualités du musulman : les bonnes manières, le partage, la vérité…',
    ],
  },
  {
    id: 'enf-edi-visio-mod3',
    titre: 'Module 3',
    prix: 190,
    rythme: '20 séances · 40 min / semaine',
    features: [
      'La Foi en Allah ﷻ : les piliers de la Foi',
      'L’importance de l’invocation',
      'Les grandes étapes de la vie du Prophète ﷺ, de la révélation à la Hijra à Médine',
      'La pratique religieuse : les étapes de la prière',
      'Le bon comportement : le droit des parents, la belle parole…',
    ],
  },
];

// ─── Enfant · Visioconférence · Coran (prix 190 €) ───
const TARIFS_CORAN_ENFANT_VISIO = [
  {
    id: 'enf-co-visio-lire',
    titre: 'Les clés de la lecture',
    prix: 190,
    rythme: '25 séances · 2 × 40 min / semaine',
    features: [
      'Prononciation correcte des lettres',
      'Découverte des outils de lecture',
      'Lecture des mots du Coran',
      'Découverte des sourates : Fatiha, Nass, Falaq, Ikhlass',
    ],
  },
  {
    id: 'enf-co-visio-regles',
    titre: 'Les secrets du Tajwid',
    prix: 190,
    rythme: '20 séances · 2 × 40 min / semaine',
    features: [
      'Découverte et application de mes premières règles de Tajwid',
      'Lecture du Coran',
      'Apprentissage de sourate Al Masad jusqu’à sourate Quraysh et de leurs enseignements',
    ],
  },
  {
    id: 'enf-co-visio-correction',
    titre: 'Perfectionnement de la lecture',
    prix: 190,
    rythme: '20 séances · 2 × 40 min / semaine',
    features: [
      'Perfectionnement des premières règles de Tajwid',
      'Apprendre à lire de façon fluide et progressive',
      'Apprentissage de sourate Al Fil à sourate Al Qadr et leurs enseignements',
    ],
  },
];

// ─── Enfant · Visioconférence · Coran & Éducation islamique (prix 290 €) ───
const TARIFS_COMBO_ENFANT_VISIO = [
  {
    id: 'enf-combo-visio-mod1',
    titre: 'Module 1',
    prix: 290,
    rythme: '50 séances · 2 × 40 min / semaine',
    featureGroups: [
      {
        titre: 'Partie Coran',
        items: [
          'Prononciation correcte des lettres',
          'Découverte des outils de lecture',
          'Lecture des mots du Coran',
          'Découverte des sourates : Fatiha, Nass, Falaq, Ikhlass',
        ],
      },
      {
        titre: 'Partie Éducation islamique',
        items: [
          'Connaître Allah ﷻ et l’attestation de Foi',
          'Découvrir le Prophète Mohammed ﷺ et les premiers chapitres de son histoire',
          'Apprendre les piliers de l’Islam et les invocations de base',
          'Développer les bonnes valeurs : le respect, la propreté, les bonnes manières…',
          'Initiation aux ablutions et à la prière',
        ],
      },
    ],
  },
  {
    id: 'enf-combo-visio-mod2',
    titre: 'Module 2',
    prix: 290,
    rythme: '40 séances · 2 × 40 min / semaine',
    featureGroups: [
      {
        titre: 'Partie Coran',
        items: [
          'Découverte et application de mes premières règles de Tajwid',
          'Lecture du Coran',
          'Apprentissage de sourate Al Masad jusqu’à sourate Quraysh et de leurs enseignements',
        ],
      },
      {
        titre: 'Partie Éducation islamique',
        items: [
          'Comprendre l’unicité d’Allah ﷻ et son adoration',
          'La vie du Prophète ﷺ, son enfance et son entourage',
          'Apprentissage étapes des ablutions',
          'Première partie sur la prière',
          'Développement des qualités du musulman : les bonnes manières, le partage, la vérité…',
        ],
      },
    ],
  },
  {
    id: 'enf-combo-visio-mod3',
    titre: 'Module 3',
    prix: 290,
    rythme: '40 séances · 2 × 40 min / semaine',
    featureGroups: [
      {
        titre: 'Partie Coran',
        items: [
          'Perfectionnement des premières règles de Tajwid',
          'Apprendre à lire de façon fluide et progressive',
        ],
      },
      {
        titre: 'Partie Éducation islamique',
        items: [
          'La Foi en Allah ﷻ : les piliers de la Foi',
          'L’importance de l’invocation',
          'Les grandes étapes de la vie du Prophète ﷺ, de la révélation à la Hijra à Médine',
          'La pratique religieuse : les étapes de la prière',
          'Le bon comportement : le droit des parents, la belle parole…',
        ],
      },
    ],
  },
];

// ─── Enfant · Visioconférence · Halaqa encadrée pour ado ───
// ⚠️ Placeholder : prix et contenu à compléter plus tard.
const TARIFS_HALAQA_ADO = [
  {
    id: 'enf-halaqa-ado',
    titre: 'Halaqa encadrée pour ado',
    prix: null,
    prixNote: '… €',
    features: [
      'Cercle d’étude (halaqa) encadré par un enseignant',
      'Assises religieuses adaptées aux adolescents',
      'Compréhension du Coran et de la Sunna',
      'Échanges sur la foi et les défis du quotidien',
      'Renforcement du comportement et des valeurs islamiques',
    ],
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
              label: 'Sciences islamiques',
              ar: 'العلوم الإسلامية',
              ico: 'إ',
              desc: 'Différents modules de sciences islamiques.',
              tarifs: TARIFS_EDI,
            },
          ],
        },
        {
          id: 'enfant',
          label: 'Enfant',
          ar: 'الصغار',
          ico: 'ص',
          desc: 'Formations destinées aux enfants.',
          children: [
            {
              id: 'enfant-autonomie',
              label: 'Autonomie',
              ar: 'التعلّم الذاتي',
              ico: 'س',
              illu: 'autonomie',
              desc: "L’enfant apprend seul ou avec un parent sur notre plateforme. Bilan de compétences une fois par mois avec un enseignant.",
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
                  label: 'Langue arabe',
                  ar: 'اللغة العربية',
                  ico: 'ع',
                  desc: 'Apprentissage de la langue arabe.',
                  tarifs: TARIFS_ARABE_ENFANT,
                },
                {
                  id: 'enfant-auto-combo',
                  label: 'Coran & Éducation islamique',
                  ar: 'القرآن والتربية الإسلامية',
                  ico: 'ق + إ',
                  desc: 'Formule combinée Coran et éducation islamique.',
                  tarifs: TARIFS_COMBO_ENFANT,
                },
              ],
            },
            {
              id: 'enfant-visio',
              label: 'Visioconférence',
              ar: 'الحصص المرئية',
              ico: 'ر',
              illu: 'visio',
              desc: 'Cours en visioconférence, en classes de 5 à 10 enfants.',
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
                  label: 'Langue arabe',
                  ar: 'اللغة العربية',
                  ico: 'ع',
                  desc: 'Apprentissage de la langue arabe.',
                  tarifs: TARIFS_ARABE_ENFANT_VISIO,
                },
                {
                  id: 'enfant-visio-combo',
                  label: 'Coran & Éducation islamique',
                  ar: 'القرآن والتربية الإسلامية',
                  ico: 'ق + إ',
                  desc: 'Formule combinée Coran et éducation islamique.',
                  tarifs: TARIFS_COMBO_ENFANT_VISIO,
                },
                {
                  id: 'enfant-visio-accompagnement',
                  label: 'Enseignement spécifique',
                  ar: 'التعليم الخاص',
                  ico: 'خ',
                  desc: 'Cours adaptés aux enfants neuroatypiques (TDAH, TDA, autisme, dysorthographie…). Classes de 3 à 5 élèves.',
                  // Stickers désactivés pour l'instant (pas de suite / tarifs à venir).
                  // Rythmes prévus (maquette) : à brancher plus tard.
                  children: [
                    { id: 'enfant-visio-acc-priere', label: 'Prière et ablution', ar: 'الصلاة والوضوء', ico: 'ص', disabled: true }, // 30 min/sem · 5 séances
                    { id: 'enfant-visio-acc-sira', label: 'Sira', ar: 'السيرة', ico: 'س', disabled: true }, // 30 min/sem · 10 séances
                    { id: 'enfant-visio-acc-seigneur', label: 'Mon Seigneur', ar: 'ربّي', ico: 'ر', disabled: true }, // 30 min/sem · 5 séances
                    { id: 'enfant-visio-acc-adam', label: 'Adam', ar: 'آدم', ico: 'أ', disabled: true }, // 20 min/sem · 5 séances
                    { id: 'enfant-visio-acc-nouh', label: 'Nouh', ar: 'نوح', ico: 'ن', disabled: true }, // 20 min/sem · 5 séances
                    { id: 'enfant-visio-acc-souleyman', label: 'Souleyman', ar: 'سليمان', ico: 'ل', disabled: true }, // 20 min/sem · 5 séances
                    { id: 'enfant-visio-acc-ibrahim', label: 'Ibrahim', ar: 'إبراهيم', ico: 'ب', disabled: true }, // 20 min/sem · 5 séances
                  ],
                },
                {
                  id: 'enfant-visio-halaqa',
                  label: 'Halaqa encadrée pour ado',
                  ar: 'حلقة مسيرة للمراهقين',
                  ico: 'ح',
                  desc: 'Assises religieuses encadrées pour adolescents.',
                  tarifs: TARIFS_HALAQA_ADO,
                },
              ],
            },
            {
              id: 'enfant-particulier',
              label: 'Cours particulier',
              ar: 'دروس خصوصية',
              ico: 'خ',
              illu: 'particulier',
              desc: 'Cours individuel avec un enseignant en visioconférence.',
              devis: true, // ⇒ clic = formulaire de devis direct (DevisStep), pas d'étape intermédiaire
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
