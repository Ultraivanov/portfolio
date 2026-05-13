import { render, screen } from '@testing-library/react';
import HomePage from '../HomePage';
import { useThemeMode } from '@/components/ClientProviders';
import type { HomeContent } from '@/content/home';

type FeaturedCase = {
  slug: string;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
};

// Mock the useThemeMode hook
jest.mock('@/components/ClientProviders');
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

const mockUseThemeMode = useThemeMode as jest.MockedFunction<typeof useThemeMode>;

// Mock home data
const mockHomeData: HomeContent = {
  hero: {
    titleImageSrc: '/hero-title.svg',
    titleImageAlt: 'Portfolio title',
    headline: 'Product Designer Portfolio',
    ctaLabel: 'View Work',
    ctaHref: '#work',
    secondaryCtaLabel: 'Contact',
    secondaryCtaHref: '#contact',
  },
  about: {
    name: 'Dmitry Ivanov',
    role: 'Product Designer',
    avatarSrc: '/avatar.png',
    description: 'Product designer with focus on user experience and system design.',
  },
  cover: {
    src: '/cover.png',
    alt: 'Portfolio cover',
  },
  skills: {
    label: 'Skills',
    groups: [
      {
        title: 'Product & User\nExperience',
        items: ['Product strategy', 'UX system', 'Interaction design'],
      },
    ],
  },
  tools: {
    label: 'Tools',
    groups: [
      {
        title: 'Design',
        items: ['Figma', 'Sketch'],
      },
    ],
  },
  pastProjects: {
    label: 'Past Projects',
    maxItems: 3,
    featuredCases: ['case-1', 'case-2'],
    items: [
      {
        title: 'Static Project',
        subtitle: 'Static subtitle',
        imageSrc: '/static.png',
        imageAlt: 'Static project',
        href: '/static',
      },
    ],
  },
  resources: {
    label: 'Resources',
    items: [
      {
        title: 'Resume',
        description: 'Download my resume',
        linkLabel: 'Download',
        href: '/resume.pdf',
      },
    ],
  },
  cta: {
    titleLine1: 'Let\'s work',
    titleLine2: 'together',
    highlight: 'together',
    description: 'Available for freelance and consulting work.',
    links: [
      { label: 'Email', href: 'mailto:test@example.com' },
    ],
  },
};

describe('HomePage', () => {
  beforeEach(() => {
    mockUseThemeMode.mockReturnValue({ 
      theme: 'light', 
      setTheme: jest.fn(), 
      toggleTheme: jest.fn() 
    });
  });

  it('renders with static projects when no featured cases provided', () => {
    render(<HomePage data={mockHomeData} />);
    
    expect(screen.getByText('Past Projects')).toBeInTheDocument();
    expect(screen.getByText('Static Project')).toBeInTheDocument();
  });

  it('renders with featured cases when provided', () => {
    const mockFeaturedCases: FeaturedCase[] = [
      {
        slug: 'case-1',
        title: 'Featured Case 1',
        subtitle: 'Featured subtitle 1',
        coverSrc: '/featured1.png',
        coverAlt: 'Featured case 1',
      },
      {
        slug: 'case-2',
        title: 'Featured Case 2',
        subtitle: 'Featured subtitle 2',
        coverSrc: '/featured2.png',
        coverAlt: 'Featured case 2',
      },
    ];

    render(<HomePage data={mockHomeData} featuredCases={mockFeaturedCases} />);
    
    expect(screen.getByText('Featured Case 1')).toBeInTheDocument();
    expect(screen.getByText('Featured Case 2')).toBeInTheDocument();
    expect(screen.getByText('Featured subtitle 1')).toBeInTheDocument();
  });

  it('handles incomplete case study data gracefully', () => {
    const incompleteCases: FeaturedCase[] = [
      {
        slug: 'case-1',
        title: 'Valid Case',
        subtitle: 'Valid subtitle',
        coverSrc: '/valid.png',
        coverAlt: 'Valid case',
      },
      // Missing title - should be filtered out
      {
        slug: 'case-2',
        title: '',
        subtitle: 'Invalid subtitle',
        coverSrc: '/invalid.png',
        coverAlt: 'Invalid case',
      },
      // Missing slug - should be filtered out
      {
        slug: '',
        title: 'Another Invalid',
        subtitle: 'Another invalid subtitle',
        coverSrc: '/invalid2.png',
        coverAlt: 'Another invalid case',
      },
      // Missing optional properties - should work with defaults
      {
        slug: 'case-3',
        title: 'Minimal Case',
        subtitle: '',
        coverSrc: '',
        coverAlt: '',
      },
    ];

    render(<HomePage data={mockHomeData} featuredCases={incompleteCases} />);
    
    // Should only show valid cases
    expect(screen.getByText('Valid Case')).toBeInTheDocument();
    expect(screen.getByText('Minimal Case')).toBeInTheDocument();
    
    // Should not show invalid cases
    expect(screen.queryByText('Another Invalid')).not.toBeInTheDocument();
    
    // Minimal case should have default alt text
    const minimalCaseLink = screen.getByText('Minimal Case').closest('a');
    expect(minimalCaseLink).toHaveAttribute('href', '/work/case-3');
  });

  it('handles empty featured cases array', () => {
    render(<HomePage data={mockHomeData} featuredCases={[]} />);
    
    // Should fall back to static projects
    expect(screen.getByText('Static Project')).toBeInTheDocument();
  });

  it('respects maxItems limit', () => {
    const manyCases: FeaturedCase[] = Array.from({ length: 5 }, (_, i) => ({
      slug: `case-${i}`,
      title: `Case ${i}`,
      subtitle: `Subtitle ${i}`,
      coverSrc: `/case${i}.png`,
      coverAlt: `Case ${i}`,
    }));

    render(<HomePage data={mockHomeData} featuredCases={manyCases} />);
    
    // Should only show 3 cases (maxItems)
    expect(screen.getAllByText(/Case \d/)).toHaveLength(3);
  });
});
