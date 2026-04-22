import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getParentUser, fetchParentEnfants } from './supabaseParent';

const ParentCtx = createContext(null);

/**
 * Contexte global du portail parent.
 * Expose : { parent, enfants, selectedEleve, selectedEleveId, setSelectedEleveId, reload }
 *
 * L'enfant sélectionné est persisté dans sessionStorage pour survivre aux navigations
 * et aux rechargements (ne déroute pas l'utilisateur si un reload se produit).
 */
export function ParentProvider({ children }) {
  const [parent, setParent]   = useState(() => getParentUser());
  const [enfants, setEnfants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEleveId, setSelectedEleveIdState] = useState(
    () => sessionStorage.getItem('parent_selected_eleve_id') || null
  );

  const reload = useCallback(async () => {
    const current = getParentUser();
    setParent(current);
    if (!current?.session_token) { setEnfants([]); setLoading(false); return; }
    setLoading(true);
    const rows = await fetchParentEnfants();
    setEnfants(rows || []);
    setLoading(false);
    // Initialiser ou valider la sélection
    if (rows && rows.length > 0) {
      const stored = sessionStorage.getItem('parent_selected_eleve_id');
      const stillValid = stored && rows.some(r => r.eleve_id === stored);
      if (!stillValid) {
        setSelectedEleveIdState(rows[0].eleve_id);
        sessionStorage.setItem('parent_selected_eleve_id', rows[0].eleve_id);
      } else {
        setSelectedEleveIdState(stored);
      }
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const setSelectedEleveId = useCallback((id) => {
    setSelectedEleveIdState(id);
    if (id) sessionStorage.setItem('parent_selected_eleve_id', id);
    else    sessionStorage.removeItem('parent_selected_eleve_id');
  }, []);

  const selectedEleve = enfants.find(e => e.eleve_id === selectedEleveId) || null;

  return (
    <ParentCtx.Provider value={{
      parent, enfants, loading,
      selectedEleve, selectedEleveId, setSelectedEleveId,
      reload,
    }}>
      {children}
    </ParentCtx.Provider>
  );
}

export function useParentCtx() {
  const ctx = useContext(ParentCtx);
  if (!ctx) throw new Error('useParentCtx doit être utilisé dans un ParentProvider');
  return ctx;
}
