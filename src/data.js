// Données du site public.
// Seul CONTACT_INFO reste utilisé (section Contact) depuis la refonte par parcours.
// L'arborescence des cours/tarifs vit désormais dans src/parcours/parcoursData.js.

export const CONTACT_INFO = [
  { icon: '◈', label: 'Adresse',              jsx: <>12 Rue de la Paix, 75002 Paris<br />Île-de-France, France</> },
  { icon: '◉', label: 'Téléphone & WhatsApp', jsx: <a href="tel:+33612345678">+33 6 12 34 56 78</a> },
  { icon: '◎', label: 'Email',                jsx: <a href="mailto:contact@ecole-alnour.fr">contact@ecole-alnour.fr</a> },
  { icon: '◇', label: "Horaires d'accueil",   jsx: <>Lun – Ven : 9h – 20h<br />Samedi : 9h – 17h</> },
  { icon: '♿', label: 'Accessibilité',        jsx: <>Établissement accessible PMR<br />Entrée de plain-pied · Sanitaires adaptés</> },
];
