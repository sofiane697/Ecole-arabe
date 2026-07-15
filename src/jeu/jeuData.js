// ─── Contenu du jeu — Le Royaume du Coran ─────────────────────────────────
// Prototype : une seule maison (« ال » التعريف), transcrite du PDF fourni par
// Sofiane. Sert à valider le gameplay avant de transcrire le reste du
// Royaume (Village du Coran, Noun/Mim, Waqf…).

export const MAISON_TAARIF = {
  id: 'al-taarif',
  nom: "La maison de l'article défini",
  nomAr: 'اَلتَّعْرِيفُ',
  desc: 'Découvre les deux familles de lettres qui changent la lecture de « al ».',
  portes: [
    {
      id: 'shamsiya',
      nom: 'ال الشمسية',
      sousTitre: 'Les lettres solaires',
      mascotte: '☀️',
      couleur: '#e08a1e',
      regles: [
        {
          titre: 'Au début de la lecture',
          points: [
            'Le Alif se lit avec la voyelle Fatha.',
            'Le Lâm ne se lit pas.',
            "La lettre d'après porte une Chedda.",
          ],
          exemple: { mot: 'اَلشَّمْسُ', note: 'Ash-Shams' },
        },
        {
          titre: 'Au milieu de la lecture',
          points: [
            'Ni le Alif ni le Lâm ne se lisent.',
            'On fait la liaison avec la lettre qui porte la Chedda.',
          ],
          exemple: { mot: 'وَالشَّمْسِ', note: 'wash-Shams' },
        },
      ],
      astuce: 'Les lettres solaires portent toujours une chedda.',
      lecture: ['اَلسَّمَاءُ', 'اَلصُّبْحُ', 'اَلنَّاسُ', 'وَالضُّحَى', 'وَالطَّارِقِ', 'وَالزَّيْتُونِ'],
    },
    {
      id: 'qamariya',
      nom: 'ال القمرية',
      sousTitre: 'Les lettres lunaires',
      mascotte: '🌙',
      couleur: '#3f5f9e',
      regles: [
        {
          titre: 'Au début de la lecture',
          points: [
            'Le Alif se lit avec la voyelle Fatha.',
            'Le Lâm se lit aussi.',
            "La lettre d'après ne porte pas de Chedda.",
          ],
          exemple: { mot: 'اَلْقَمَرُ', note: 'Al-Qamar' },
        },
        {
          titre: 'Au milieu de la lecture',
          points: [
            'Le Alif ne se lit pas.',
            'Le Lâm se lit toujours.',
            'On fait la liaison avec le Lâm.',
          ],
          exemple: { mot: 'وَالْقَمَرِ', note: 'wal-Qamar' },
        },
      ],
      astuce: 'Les lettres lunaires ne portent jamais de chedda.',
      lecture: ['بِالْهَزْلِ', 'وَالْفَجْرِ', 'الْوَتْرِ', 'الْغَاشِيَةِ', 'الْخُنَّاسِ', 'وَالْمَلَكُ'],
    },
  ],
  // Évaluation finale de la maison : mélange des deux familles.
  evaluation: [
    { mot: 'اَلنَّهَارَ', famille: 'shamsiya' },
    { mot: 'اَلرَّحِيمِ', famille: 'shamsiya' },
    { mot: 'اَلظَّالِمِينَ', famille: 'shamsiya' },
    { mot: 'اَلذِّكْرَى', famille: 'shamsiya' },
    { mot: 'اَلدُّنْيَا', famille: 'shamsiya' },
    { mot: 'الْقَدَرِ', famille: 'qamariya' },
    { mot: 'الْكَوْثَرَ', famille: 'qamariya' },
    { mot: 'الْيَقِينِ', famille: 'qamariya' },
    { mot: 'الْحُطَمَةُ', famille: 'qamariya' },
    { mot: 'فِي الْبَلَدِ', famille: 'qamariya' },
  ],
};
