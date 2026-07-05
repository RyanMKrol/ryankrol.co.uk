import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import SearchInput from '../../components/SearchInput';
import Pill from '../../components/Pill';
import SortButtons from '../../components/SortButtons';
import MasonryColumns from '../../components/MasonryColumns';
import useResponsiveColumnCount from '../../hooks/useResponsiveColumnCount';

const SORT_FIELDS = [
  { key: 'date', label: 'date', defaultValue: 'date', flippedValue: 'date-asc', defaultArrow: '↓', flippedArrow: '↑' },
  { key: 'stars', label: 'stars', defaultValue: 'stars', flippedValue: 'stars-asc', defaultArrow: '↓', flippedArrow: '↑' },
];

const LANGUAGE_COLORS = {
  TypeScript: '#3178C6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Shell: '#89E051',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Ruby: '#701516',
};

const FALLBACK_LANGUAGE_COLOR = '#8A837A';

const TAG_DISPLAY_LIMIT = 12;

function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || FALLBACK_LANGUAGE_COLOR;
}

function formatUpdatedAgo(dateString) {
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const units = [
    { label: 'y', secs: 31536000 },
    { label: 'mo', secs: 2592000 },
    { label: 'd', secs: 86400 },
    { label: 'h', secs: 3600 },
    { label: 'm', secs: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(seconds / unit.secs);
    if (value >= 1) return `${value}${unit.label} ago`;
  }
  return 'just now';
}

export default function ProjectsPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const columnCount = useResponsiveColumnCount(3, 900);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch('/api/github/repos');
        if (response.ok) {
          const data = await response.json();
          setRepos(data.repos || []);
        } else {
          setError('Failed to fetch GitHub repositories');
        }
      } catch (err) {
        setError('Error fetching GitHub repositories');
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, []);

  const allTags = useMemo(() => {
    const counts = new Map();
    repos.flatMap((repo) => repo.topics || []).forEach((topic) => {
      counts.set(topic, (counts.get(topic) || 0) + 1);
    });
    return [...counts.keys()].sort((a, b) => {
      const countDiff = counts.get(b) - counts.get(a);
      return countDiff !== 0 ? countDiff : a.localeCompare(b);
    });
  }, [repos]);

  const visibleTags = useMemo(() => {
    if (tagsExpanded || allTags.length <= TAG_DISPLAY_LIMIT) return allTags;
    const topTags = allTags.slice(0, TAG_DISPLAY_LIMIT);
    const strandedSelectedTags = selectedTags.filter((tag) => !topTags.includes(tag));
    return [...topTags, ...strandedSelectedTags];
  }, [allTags, tagsExpanded, selectedTags]);

  const toggleTag = (tag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  };

  const filteredRepos = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return repos.filter((repo) => {
      const matchesSearch =
        repo.name.toLowerCase().includes(term) ||
        (repo.description || '').toLowerCase().includes(term);
      const matchesTags =
        selectedTags.length === 0 ||
        (repo.topics || []).some((topic) => selectedTags.includes(topic));
      return matchesSearch && matchesTags;
    });
  }, [repos, searchTerm, selectedTags]);

  const sortedRepos = useMemo(() => {
    const sorted = [...filteredRepos];
    if (sortBy === 'date-asc') {
      sorted.sort((a, b) => new Date(a.lastPush) - new Date(b.lastPush));
    } else if (sortBy === 'stars') {
      sorted.sort((a, b) => (b.stars || 0) - (a.stars || 0));
    } else if (sortBy === 'stars-asc') {
      sorted.sort((a, b) => (a.stars || 0) - (b.stars || 0));
    } else {
      sorted.sort((a, b) => new Date(b.lastPush) - new Date(a.lastPush));
    }
    return sorted;
  }, [filteredRepos, sortBy]);

  return (
    <>
      <Head>
        <title>My Projects - ryankrol.co.uk</title>
      </Head>

      <div className="container">
        <Header />

        <div className="collection-review-header">
          <div className="collection-review-title-group">
            <h1 className="page-title">projects</h1>
            <p className="collection-review-meta">
              what I&apos;ve been building on github
            </p>
          </div>

          <div className="collection-review-controls">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="search by title or description..."
            />
            <SortButtons fields={SORT_FIELDS} sortBy={sortBy} onChange={setSortBy} />
            {allTags.length > 0 && (
              <div className="collection-pill-group">
                {visibleTags.map((tag) => (
                  <Pill
                    key={tag}
                    active={selectedTags.includes(tag)}
                    accentColor="var(--accent-projects)"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Pill>
                ))}
                {allTags.length > TAG_DISPLAY_LIMIT && (
                  <Pill
                    onClick={() => setTagsExpanded((current) => !current)}
                  >
                    {tagsExpanded ? 'show less' : `+${allTags.length - TAG_DISPLAY_LIMIT} more`}
                  </Pill>
                )}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading projects...
          </div>
        )}

        {error && (
          <div className="inline-error">
            {error}
          </div>
        )}

        {!loading && !error && repos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No active repositories found.
          </div>
        )}

        {!loading && !error && repos.length > 0 && filteredRepos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No projects match your search/filters.
          </div>
        )}

        {!loading && !error && filteredRepos.length > 0 && (
          <MasonryColumns
            items={sortedRepos}
            columnCount={columnCount}
            className="projects-grid"
            columnClassName="projects-grid-col"
            renderItem={(repo) => (
              <div key={repo.fullName} className="project-card">
                <div className="project-card-top">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-card-name"
                  >
                    {repo.name}
                  </a>
                  <span className="project-card-stars">
                    ★ {repo.stars || 0}
                  </span>
                </div>

                {repo.description && (
                  <p className="project-card-description">{repo.description}</p>
                )}

                <div className="project-card-meta-row">
                  {repo.language && (
                    <span className="project-card-language">
                      <span
                        className="project-card-language-dot"
                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                      />
                      {repo.language}
                    </span>
                  )}
                  {repo.lastPush && (
                    <span className="project-card-updated">
                      updated {formatUpdatedAgo(repo.lastPush)}
                    </span>
                  )}
                  {typeof repo.forks === 'number' && repo.forks > 0 && (
                    <span className="project-card-forks">
                      {repo.forks} {repo.forks === 1 ? 'fork' : 'forks'}
                    </span>
                  )}
                  {repo.archived && (
                    <Badge accentColor="var(--color-ink-mute)" variant="soft" mono={false}>
                      archived
                    </Badge>
                  )}
                </div>

                {repo.topics && repo.topics.length > 0 && (
                  <div className="project-card-tags">
                    {repo.topics.slice(0, 5).map((topic) => (
                      <Badge key={topic} accentColor="var(--accent-projects)" variant="soft" mono={false}>
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
        )}
      </div>
    </>
  );
}
