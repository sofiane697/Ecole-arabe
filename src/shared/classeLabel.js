/** Libellé d'une classe précédé de son niveau scolaire : "Niveau — Classe". */
export function classeLabel(classeId, classes, niveaux) {
  if (!classeId) return null;
  const classe = (classes || []).find(c => c.id === classeId);
  if (!classe) return null;
  const niveau = (niveaux || []).find(n => n.id === classe.niveau_id);
  return niveau ? `${niveau.nom} — ${classe.nom}` : classe.nom;
}
