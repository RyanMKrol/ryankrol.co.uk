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
vercel env pull .env.local
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
vercel env pull .env.local
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
```

## License

This project is private and not open for public contribution.
