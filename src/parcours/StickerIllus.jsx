// Illustrations SVG des stickers (trait doré, hérite de `color` du cercle .sticker-ico).
// Clé = valeur du champ `illu` d'un nœud du parcours (cf. parcoursData.js).
// Style cohérent avec les icônes du site : fill none, stroke currentColor, traits arrondis.

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'sticker-illu',
  'aria-hidden': true,
};

const ILLUS = {
  // Autonomie : un enfant seul devant son ordinateur.
  autonomie: (
    <svg {...svgProps}>
      <circle cx="12" cy="6" r="2.4" />
      <path d="M8 14q4 -3 8 0" />
      <rect x="6.5" y="13" width="11" height="5.5" rx="1" />
      <path d="M4.5 18.5h15l1.3 2.4H3.2z" />
    </svg>
  ),

  // Visioconférence : interface type Zoom, grille de plusieurs enfants.
  visio: (
    <svg {...svgProps}>
      <rect x="3" y="4.5" width="18" height="13" rx="2" />
      <path d="M12 4.5v13M3 11h18" />
      <circle cx="7.5" cy="7" r="1" />
      <path d="M6 9.4q1.5 -1.4 3 0" />
      <circle cx="16.5" cy="7" r="1" />
      <path d="M15 9.4q1.5 -1.4 3 0" />
      <circle cx="7.5" cy="13.5" r="1" />
      <path d="M6 15.9q1.5 -1.4 3 0" />
      <circle cx="16.5" cy="13.5" r="1" />
      <path d="M15 15.9q1.5 -1.4 3 0" />
      <path d="M9 20.5h6M12 17.5v3" />
    </svg>
  ),

  // Cours particulier : un enfant et un enseignant (deux silhouettes de tailles différentes).
  particulier: (
    <svg {...svgProps}>
      <circle cx="8" cy="9" r="2" />
      <path d="M4.5 20v-2.5a3.5 3.5 0 0 1 7 0V20" />
      <circle cx="16" cy="6.5" r="2.3" />
      <path d="M11.8 20v-4a4.2 4.2 0 0 1 8.4 0v4" />
    </svg>
  ),
};

export default ILLUS;
