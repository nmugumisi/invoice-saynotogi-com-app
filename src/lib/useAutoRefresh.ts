import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useData } from '../context/DataContext';

/**
 * Re-fetches from the WordPress site whenever this screen regains focus, so
 * changes made elsewhere (wp-admin, another device) show up without a
 * manual pull-to-refresh. No-op when not connected to an API.
 */
export function useAutoRefreshOnFocus() {
  const { connection, refreshAll } = useData();

  useFocusEffect(
    useCallback(() => {
      if (connection) {
        refreshAll();
      }
    }, [connection, refreshAll]),
  );
}
