export const NAV = [
  { id: 'accueil',      label: 'Accueil'  },
  { id: 'presentation', label: "L'École"  },
  { id: 'tarifs',       label: 'Cours / Tarifs'   },
  { id: 'contact',      label: 'Contact'  },
];

export const COURSES = [
  {
    level: 'Niveau 1',
    ar: 'مبتدئ',
    fr: 'Débutant — Alphabet',
    price: 35,
    freq: '1 séance / semaine · 1h',
    featured: false,
    features: [
      "Apprentissage de l'alphabet arabe",
      'Lecture des lettres isolées & liées',
      'Premiers mots du vocabulaire courant',
      'Exercices écrits & oraux',
      'Support de cours inclus',
    ],
  },
  {
    level: 'Niveau 2',
    ar: 'متوسط',
    fr: 'Intermédiaire — Lecture',
    price: 55,
    freq: '2 séances / semaine · 1h',
    featured: true,
    features: [
      'Lecture fluide de textes simples',
      'Introduction à la grammaire arabe',
      'Conjugaison des verbes courants',
      'Expression orale guidée',
      'Accès à la plateforme en ligne',
    ],
  },
  {
    level: 'Niveau 3',
    ar: 'متقدم',
    fr: 'Avancé — Expression',
    price: 75,
    freq: '2 séances / semaine · 1h30',
    featured: false,
    features: [
      'Grammaire & syntaxe approfondies',
      'Rédaction en arabe classique',
      'Littérature & textes authentiques',
      'Expression orale avancée',
      'Suivi personnalisé mensuel',
    ],
  },
];

export const VALUES = [
  { icon: 'ا', name: 'Méthode progressive',        desc: "De l'alphabet aux textes avancés, chaque étape est solidement consolidée avant d'avancer." },
  { icon: 'ب', name: 'Petits groupes',              desc: 'Des classes réduites pour un suivi personnalisé et une attention maximale à chaque élève.' },
  { icon: 'ت', name: 'En ligne & présentiel',       desc: 'Flexibilité totale selon votre emploi du temps et vos préférences d\'apprentissage.' },
  { icon: 'ث', name: 'Immersion culturelle',        desc: 'Au-delà de la langue, découvrez la richesse de la civilisation et de la culture arabes.' },
  { icon: '♿', name: 'Établissement accessible',   desc: "Nos locaux sont entièrement accessibles aux personnes en fauteuil roulant et à mobilité réduite. Rampe d'accès, salles de plain-pied, sanitaires adaptés." },
];

export const CONTACT_INFO = [
  { icon: '◈', label: 'Adresse',              jsx: <>12 Rue de la Paix, 75002 Paris<br />Île-de-France, France</> },
  { icon: '◉', label: 'Téléphone & WhatsApp', jsx: <a href="tel:+33612345678">+33 6 12 34 56 78</a> },
  { icon: '◎', label: 'Email',                jsx: <a href="mailto:contact@ecole-alnour.fr">contact@ecole-alnour.fr</a> },
  { icon: '◇', label: "Horaires d'accueil",   jsx: <>Lun – Ven : 9h – 20h<br />Samedi : 9h – 17h</> },
  { icon: '♿', label: 'Accessibilité',        jsx: <>Établissement accessible PMR<br />Entrée de plain-pied · Sanitaires adaptés</> },
];

export const TESTIMONIALS = [
  {
    name: 'Fatima B.',
    role: 'Niveau Intermédiaire',
    quote: "Grâce à l'École Al-Nour, j'ai appris à lire couramment en seulement 6 mois. La pédagogie est bienveillante et les enseignants sont extrêmement patients.",
    stars: 5,
    initials: 'FB',
  },
  {
    name: 'Thomas M.',
    role: 'Niveau Débutant',
    quote: "Je recommande vivement ! L'apprentissage de l'alphabet a été progressif et bien structuré. Je n'aurais jamais cru pouvoir lire l'arabe aussi rapidement.",
    stars: 5,
    initials: 'TM',
  },
  {
    name: 'Nadia K.',
    role: 'Cours Coranique',
    quote: "Mes deux enfants suivent les cours depuis un an. Leur progression est remarquable et ils adorent venir en classe. Un cadre bienveillant et exceptionnel.",
    stars: 5,
    initials: 'NK',
  },
];

export const CORAN_FEATURES = [
  'Règles du Tajwid pas à pas',
  'Mémorisation progressive des sourates',
  'Correction de la prononciation',
  'Cours individuels ou en groupe',
];
