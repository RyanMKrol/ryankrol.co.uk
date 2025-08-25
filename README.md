# ryankrol.co.uk

A personal website built with Next.js featuring reviews for books, movies, TV shows, albums, and workout tracking via the Hevy API.

## Tech Stack

- **Framework**: Next.js 15.5.0 with React 19
- **Database**: AWS DynamoDB
- **Styling**: CSS with custom design system
- **Font**: JetBrains Mono (Google Fonts)
- **API Integration**: Hevy API for workout data
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Vercel CLI (for environment variables)

```bash
npm install -g vercel
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ryankrol.co.uk.git
cd ryankrol.co.uk
```

2. Install dependencies:

```bash
npm install
```

3. Pull environment variables from Vercel:

```bash
vercel env pull .env.local --environment production
```

4. Start the development server:

```bash
npm run dev
```

The site will be available at `http://localhost:3000` (or next available port).

## Environment Variables

### Managing Environment Variables

**Pull from Vercel:**

```bash
vercel env pull .env.local --environment production
```

**Add new environment variable:**

```bash
vercel env add VARIABLE_NAME production
# Follow prompts to enter the value
```

## Development

### Local Development

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint (if configured)

# Workout data migration
npm run workout:create-tables  # Create DynamoDB tables for workouts
npm run workout:migrate-data   # Migrate all data from Hevy API
```

## Database Schema

### DynamoDB Tables

#### Workouts Table
Complete workout records with computed metrics.

**Primary Key:** `id` (String) - Hevy workout ID  
**GSI:** `start_time-index` - For chronological queries

**Schema:**
```javascript
{
  id: "workout-uuid",                    // Primary key (Hevy workout ID)
  title: "Push Day",                     // Workout title
  start_time: "2024-01-15T10:00:00Z",    // ISO timestamp
  end_time: "2024-01-15T11:30:00Z",      // ISO timestamp
  exercises: [...],                      // Complete Hevy exercise data
  
  // Computed metrics
  totalVolume: 2450.5,                   // Total kg lifted (0 for cardio-only)
  totalWorkingSets: 12,                  // Non-warmup sets
  totalWarmupSets: 3,                    // Warmup sets
  uniqueExercises: 4,                    // Number of different exercises
  strengthExercises: 3,                  // Exercises with weights
  cardioExercises: 1,                    // Exercises with distance/duration
  totalDistance: 1500.0,                // Total meters (null if none)
  totalDuration: 1200,                   // Total seconds (null if none)
  durationMinutes: 90,                   // Workout duration
  workoutDate: "2024-01-15",             // YYYY-MM-DD format
  workoutType: "mixed",                  // 'strength', 'cardio', 'mixed', 'bodyweight'
  
  // Metadata
  created_at: "2024-01-15T12:00:00Z",    // Migration timestamp
  data_source: "hevy_api"                // Source identifier
}
```

#### Exercises Table
Individual exercise records with detailed metrics for each exercise within a workout.

**Primary Key:** `exercise_id` (String) - `{workout_id}_{exercise_index}`  
**GSI:** `workout_id-index` - Query all exercises in a workout  
**GSI:** `exercise_name-workout_date-index` - Exercise history over time

**Schema:**
```javascript
{
  exercise_id: "workout-uuid_0",         // Primary key
  workout_id: "workout-uuid",            // Links to workout
  exercise_name: "Bench Press",          // Exercise name
  workout_date: "2024-01-15",            // YYYY-MM-DD format
  workout_title: "Push Day",             // Parent workout title
  start_time: "2024-01-15T10:00:00Z",    // Workout start
  end_time: "2024-01-15T11:30:00Z",      // Workout end
  sets: [...],                           // Complete Hevy set data
  exercise_index: 0,                     // Position in workout
  
  // Computed metrics
  sessionVolume: 450.5,                  // Total kg for this exercise (0 for cardio)
  heaviestWeight: 80.0,                  // Max weight used (null for cardio)
  bestEstimated1RM: 95.2,                // Best 1RM estimate (null for cardio)
  totalWorkingSets: 3,                   // Non-warmup sets
  totalWarmupSets: 1,                    // Warmup sets
  totalReps: 24,                         // Total reps performed
  workingSetVolume: 420.0,               // Volume excluding warmups
  averageWeight: 75.5,                   // Average working weight (null for cardio)
  totalDistance: 5000.0,                 // Meters (null if none)
  totalDuration: 1800,                   // Seconds (null if none)
  exerciseType: "strength",              // 'strength', 'cardio', 'bodyweight'
  
  // Metadata
  created_at: "2024-01-15T12:00:00Z",    // Migration timestamp
  data_source: "hevy_api"                // Source identifier
}
```

### Table Management Commands

```bash
# Create both tables with proper indexes
npm run workout:create-tables

# Migrate all workout data from Hevy API
# - Fetches all pages with 100ms rate limiting
# - Calculates comprehensive metrics
# - Prevents duplicate data on re-runs
npm run workout:migrate-data
```

### Query Examples

**Get recent workouts:**
```javascript
// Query Workouts table using start_time-index
const params = {
  TableName: 'Workouts',
  IndexName: 'start_time-index',
  KeyConditionExpression: 'start_time BETWEEN :start AND :end'
};
```

**Get exercise history for bench press:**
```javascript
// Query Exercises table using exercise_name-workout_date-index
const params = {
  TableName: 'Exercises',
  IndexName: 'exercise_name-workout_date-index',
  KeyConditionExpression: 'exercise_name = :name',
  ExpressionAttributeValues: {
    ':name': 'Bench Press'
  }
};
```

**Get all exercises from a specific workout:**
```javascript
// Query Exercises table using workout_id-index
const params = {
  TableName: 'Exercises',
  IndexName: 'workout_id-index',
  KeyConditionExpression: 'workout_id = :workoutId'
};
```

## License

This project is private and not open for public contribution.
