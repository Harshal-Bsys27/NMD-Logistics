'use client';

import { useCallback, useEffect, useState } from 'react';
import { assignmentService, driverService, orderService } from '@/services/database';
import type { Assignment, DeliveryPersonnel, Order } from '@/types';

export function useOperationsData() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryPersonnel[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const [orderResult, driverResult, assignmentResult] = await Promise.all([
        orderService.getAll(),
        driverService.getAll(),
        assignmentService.getAll(),
      ]);
      const firstError = orderResult.error || driverResult.error || assignmentResult.error;
      if (firstError) throw new Error(firstError);

      setOrders(orderResult.data ?? []);
      setDrivers(driverResult.data ?? []);
      setAssignments(assignmentResult.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load operations data');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { orders, drivers, assignments, isLoading, error, refresh };
}
