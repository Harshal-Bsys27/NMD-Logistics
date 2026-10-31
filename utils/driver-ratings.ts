import type { DeliveryFeedback } from '@/types';

export function getDriverRating(
  driverId: string,
  feedback: DeliveryFeedback[],
  fallbackRating = 0
) {
  const ratings = feedback.filter((entry) => entry.personnel_id === driverId);
  return {
    count: ratings.length,
    average: ratings.length
      ? ratings.reduce((total, entry) => total + entry.rating, 0) / ratings.length
      : fallbackRating,
  };
}
