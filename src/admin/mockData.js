// ─── Données fictives pour l'interface admin ───────────────────────────────

export const MOCK_INSCRIPTIONS = [
  { id: 1, nom: 'Benali',     prenom: 'Youssef',  age: 8,  cours: 'Débutant — Alphabet',          annees: 0, statut: 'nouveau',  date: '2026-03-24' },
  { id: 2, nom: 'Hamidi',     prenom: 'Lina',     age: 12, cours: 'Intermédiaire — Lecture',       annees: 2, statut: 'contacté', date: '2026-03-23' },
  { id: 3, nom: 'Touati',     prenom: 'Adam',     age: 10, cours: 'Lecture & Mémorisation Coran',  annees: 1, statut: 'inscrit',  date: '2026-03-22' },
  { id: 4, nom: 'Mebarki',    prenom: 'Sara',     age: 15, cours: 'Avancé — Expression',           annees: 4, statut: 'nouveau',  date: '2026-03-21' },
  { id: 5, nom: 'Chérif',     prenom: 'Ilyès',   age: 7,  cours: 'Débutant — Alphabet',           annees: 0, statut: 'inscrit',  date: '2026-03-20' },
  { id: 6, nom: 'Boukhalfa',  prenom: 'Nour',     age: 11, cours: 'Intermédiaire — Lecture',       annees: 1, statut: 'contacté', date: '2026-03-19' },
  { id: 7, nom: 'Rahmani',    prenom: 'Amine',    age: 9,  cours: 'Débutant — Alphabet',           annees: 0, statut: 'nouveau',  date: '2026-03-18' },
  { id: 8, nom: 'Ziani',      prenom: 'Kenza',    age: 14, cours: 'Avancé — Expression',           annees: 3, statut: 'inscrit',  date: '2026-03-17' },
  { id: 9, nom: 'Brahimi',    prenom: 'Rayan',    age: 8,  cours: 'Lecture & Mémorisation Coran',  annees: 0, statut: 'nouveau',  date: '2026-03-16' },
  { id:10, nom: 'Mansouri',   prenom: 'Dina',     age: 13, cours: 'Intermédiaire — Lecture',       annees: 2, statut: 'contacté', date: '2026-03-15' },
];

export const MOCK_MESSAGES = [
  { id: 1, nom: 'Dupont',   prenom: 'Marie',   email: 'marie.dupont@mail.com',   cours: 'Débutant — Alphabet',         message: 'Bonjour, je souhaite inscrire mon fils de 7 ans. Quelles sont les modalités d\'inscription et les horaires disponibles ?', lu: false, date: '2026-03-24' },
  { id: 2, nom: 'Martin',   prenom: 'Karim',   email: 'k.martin@gmail.com',      cours: 'Intermédiaire — Lecture',      message: 'Salam, j\'ai étudié l\'arabe pendant 2 ans. Est-ce que le niveau intermédiaire me correspond ? Peut-on faire un test de niveau ?', lu: false, date: '2026-03-23' },
  { id: 3, nom: 'Leblanc',  prenom: 'Fatima',  email: 'f.leblanc@outlook.fr',    cours: 'Lecture & Mémorisation Coran', message: 'Assalamou alaykoum, je cherche un cours de Coran pour ma fille de 10 ans. Avez-vous des créneaux le mercredi après-midi ?', lu: true,  date: '2026-03-22' },
  { id: 4, nom: 'Rousseau', prenom: 'Tarek',   email: 'tarek.r@yahoo.fr',        cours: 'Avancé — Expression',          message: 'Bonjour, je suis arabophone mais je veux améliorer mon expression écrite. Le cours avancé est-il adapté ?', lu: true,  date: '2026-03-21' },
  { id: 5, nom: 'Moreau',   prenom: 'Aïcha',  email: 'aicha.moreau@gmail.com',  cours: 'Débutant — Alphabet',          message: 'Bonsoir, est-ce que vous proposez des cours pour adultes débutants ? J\'ai 35 ans et je veux apprendre l\'arabe pour mieux comprendre le Coran.', lu: false, date: '2026-03-20' },
  { id: 6, nom: 'Bernard',  prenom: 'Sofiane', email: 's.bernard@mail.fr',       cours: 'Intermédiaire — Lecture',      message: 'Bonjour, est-ce qu\'il est possible de faire un cours d\'essai avant de s\'engager sur un mois complet ?', lu: true,  date: '2026-03-19' },
  { id: 7, nom: 'Petit',    prenom: 'Leïla',  email: 'leila.petit@hotmail.fr',  cours: 'Avancé — Expression',          message: 'Salam alaykoum, j\'ai passé mon bac arabe en Algérie. Je cherche à perfectionner mon niveau. Quels sont les objectifs du cours avancé ?', lu: false, date: '2026-03-18' },
];
