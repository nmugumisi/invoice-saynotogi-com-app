import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useData } from '../context/DataContext';

/**
 * Re-fetches from the server whenever this screen regains focus, so changes
 * made elsewhere (wp-admin, another device) show up without a manual
 * pull-to-refresh.
 */
export function useAutoRefreshOnFocus() {
  const { refreshAll } = useData();

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll]),
  );
}
