import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type RouteName =
  | 'pleito'
  | 'partidos'
  | 'coligacoes'
  | 'quociente'
  | 'dossie'
  | 'candidato'
  | 'cadastros'
  | 'sql_explorer'
  | 'infra_config';

export interface RouteState {
  name: RouteName;
  params: Record<string, string>;
  query: Record<string, string>;
}

interface RouterContextType {
  currentRoute: RouteState;
  navigate: (pathOrRoute: string | { name: RouteName; params?: Record<string, string>; query?: Record<string, string> }) => void;
  openCandidato: (tituloEleitor: string) => void;
}

const parseHash = (hash: string): RouteState => {
  // Strip leading '#' or '#/'
  const raw = hash.replace(/^#\/?/, '').trim();
  const [pathPart, queryString] = raw.split('?');
  const segments = pathPart ? pathPart.split('/').filter(Boolean) : [];

  const query: Record<string, string> = {};
  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((val, key) => {
      query[key] = val;
    });
  }

  // Route matching
  if (segments.length === 0 || segments[0] === 'pleito') {
    return { name: 'pleito', params: {}, query };
  }

  if (segments[0] === 'partidos') {
    return { name: 'partidos', params: {}, query };
  }

  if (segments[0] === 'coligacoes') {
    return { name: 'coligacoes', params: {}, query };
  }

  if (segments[0] === 'quociente' || segments[0] === 'quociente-eleitoral') {
    return { name: 'quociente', params: {}, query };
  }

  if (segments[0] === 'dossie') {
    if (segments[1]) {
      return { name: 'candidato', params: { titulo: segments[1] }, query };
    }
    return { name: 'dossie', params: {}, query };
  }

  if (segments[0] === 'candidato') {
    return { name: 'candidato', params: { titulo: segments[1] || '' }, query };
  }

  if (segments[0] === 'cadastros') {
    return { name: 'cadastros', params: {}, query };
  }

  if (segments[0] === 'sql-explorer' || segments[0] === 'sql_explorer') {
    return { name: 'sql_explorer', params: {}, query };
  }

  if (segments[0] === 'configuracao' || segments[0] === 'infra_config') {
    return { name: 'infra_config', params: {}, query };
  }

  return { name: 'pleito', params: {}, query };
};

const RouterContext = createContext<RouterContextType | null>(null);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<RouteState>(() =>
    parseHash(window.location.hash || '#/pleito')
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    // If no hash, set initial
    if (!window.location.hash) {
      window.location.hash = '#/pleito';
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback(
    (
      target:
        | string
        | { name: RouteName; params?: Record<string, string>; query?: Record<string, string> }
    ) => {
      if (typeof target === 'string') {
        let hash = target;
        if (!hash.startsWith('#')) {
          hash = `#/${hash.replace(/^\//, '')}`;
        }
        window.location.hash = hash;
        return;
      }

      let path = '';
      switch (target.name) {
        case 'pleito':
          path = '#/pleito';
          break;
        case 'partidos':
          path = '#/partidos';
          break;
        case 'coligacoes':
          path = '#/coligacoes';
          break;
        case 'quociente':
          path = '#/quociente';
          break;
        case 'dossie':
          path = '#/dossie';
          break;
        case 'candidato':
          path = `#/candidato/${target.params?.titulo || ''}`;
          break;
        case 'cadastros':
          path = '#/cadastros';
          break;
        case 'sql_explorer':
          path = '#/sql-explorer';
          break;
        case 'infra_config':
          path = '#/configuracao';
          break;
      }

      if (target.query && Object.keys(target.query).length > 0) {
        const search = new URLSearchParams(target.query).toString();
        path += `?${search}`;
      }

      window.location.hash = path;
    },
    []
  );

  const openCandidato = useCallback((tituloEleitor: string) => {
    window.location.hash = `#/candidato/${tituloEleitor}`;
  }, []);

  return (
    <RouterContext.Provider value={{ currentRoute, navigate, openCandidato }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useAppRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useAppRouter must be used within a RouterProvider');
  }
  return context;
};
