import { useAppSelector } from '@/app/hooks';
import { useCallback } from 'react';

export const useSaveToFile = () => {
  const { docName  } = useAppSelector(state => state.doc);
  const { pages  } = useAppSelector(state => state.doc.currentState);

  return {
    onSave: useCallback(() => {
      const fileName = docName;

      const json = JSON.stringify({ pages: pages, docName }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = href;
      link.download = fileName + '.json';
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    }, [pages]),
  };
};
