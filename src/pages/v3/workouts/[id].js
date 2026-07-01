import { useRouter } from 'next/router';
import V3WorkoutDetail from '../../../components/v3/V3WorkoutDetail';

export default function V3WorkoutDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  return <V3WorkoutDetail workoutId={id} />;
}
