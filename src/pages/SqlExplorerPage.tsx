import React from 'react';
import { SqlExplorerView } from '../components/SqlExplorerView';
import { useAppRouter } from '../router/RouterContext';

export const SqlExplorerPage: React.FC = () => {
  const { currentRoute } = useAppRouter();
  const subTab = (currentRoute.query?.tab as 'queries' | 'diagram' | 'ddl' | 'indexes') || 'queries';

  return (
    <div className="space-y-6">
      <SqlExplorerView initialTab={subTab} />
    </div>
  );
};
