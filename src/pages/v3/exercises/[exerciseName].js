import { useRouter } from 'next/router';
import V3ExerciseDetail from '../../../components/v3/V3ExerciseDetail';

export default function V3ExerciseDetailPage() {
  const router = useRouter();
  const { exerciseName } = router.query;
  return <V3ExerciseDetail exerciseName={exerciseName} />;
}
