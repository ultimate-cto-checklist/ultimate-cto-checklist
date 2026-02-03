import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GuidePanel from '@/components/GuidePanel'

describe('GuidePanel', () => {
  describe('Markdown Rendering', () => {
    it('should render basic markdown content', () => {
      const markdown = '# Test Heading\n\nThis is a paragraph.'
      render(<GuidePanel markdown={markdown} />)

      expect(screen.getByRole('heading', { level: 1, name: 'Test Heading' })).toBeInTheDocument()
      expect(screen.getByText('This is a paragraph.')).toBeInTheDocument()
    })

    it('should render multiple heading levels', () => {
      const markdown = `# H1 Heading
## H2 Heading
### H3 Heading
Content here.`
      render(<GuidePanel markdown={markdown} />)

      expect(screen.getByRole('heading', { level: 1, name: 'H1 Heading' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'H2 Heading' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'H3 Heading' })).toBeInTheDocument()
    })

    it('should render code blocks with monospace styling', () => {
      const markdown = '```bash\necho "test"\n```'
      render(<GuidePanel markdown={markdown} />)

      const codeBlock = screen.getByText(/echo "test"/)
      expect(codeBlock).toBeInTheDocument()
    })

    it('should render inline code', () => {
      const markdown = 'Use `npm install` to install dependencies.'
      render(<GuidePanel markdown={markdown} />)

      expect(screen.getByText('npm install')).toBeInTheDocument()
    })

    it('should render lists', () => {
      const markdown = `- Item 1
- Item 2
- Item 3`
      render(<GuidePanel markdown={markdown} />)

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })

    it('should render links', () => {
      const markdown = '[Click here](https://example.com)'
      render(<GuidePanel markdown={markdown} />)

      const link = screen.getByRole('link', { name: 'Click here' })
      expect(link).toHaveAttribute('href', 'https://example.com')
    })

    it('should render bold and italic text', () => {
      const markdown = '**bold text** and *italic text*'
      render(<GuidePanel markdown={markdown} />)

      expect(screen.getByText('bold text')).toBeInTheDocument()
      expect(screen.getByText('italic text')).toBeInTheDocument()
    })
  })

  describe('Table of Contents Generation', () => {
    it('should generate TOC from h2 headings', () => {
      const markdown = `# Main Title
## Section One
Content here.
## Section Two
More content.`
      render(<GuidePanel markdown={markdown} />)

      // TOC should contain links to h2 sections
      expect(screen.getByRole('link', { name: 'Section One' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Section Two' })).toBeInTheDocument()
    })

    it('should generate nested TOC with h3 under h2', () => {
      const markdown = `# Main Title
## Section One
### Subsection 1.1
### Subsection 1.2
## Section Two
### Subsection 2.1`
      render(<GuidePanel markdown={markdown} />)

      // All headings should be in TOC
      expect(screen.getByRole('link', { name: 'Section One' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Subsection 1.1' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Subsection 1.2' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Section Two' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Subsection 2.1' })).toBeInTheDocument()
    })

    it('should create proper anchor links from heading text', () => {
      const markdown = `## Section With Spaces
## Section-With-Dashes
## Section_With_Underscores`
      render(<GuidePanel markdown={markdown} />)

      const link1 = screen.getByRole('link', { name: 'Section With Spaces' })
      const link2 = screen.getByRole('link', { name: 'Section-With-Dashes' })
      const link3 = screen.getByRole('link', { name: 'Section_With_Underscores' })

      expect(link1).toHaveAttribute('href', '#section-with-spaces')
      expect(link2).toHaveAttribute('href', '#section-with-dashes')
      expect(link3).toHaveAttribute('href', '#section_with_underscores')
    })

    it('should handle special characters in headings', () => {
      const markdown = `## Section: With Colon
## Section (with parens)
## Section & Ampersand`
      render(<GuidePanel markdown={markdown} />)

      expect(screen.getByRole('link', { name: 'Section: With Colon' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Section (with parens)' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Section & Ampersand' })).toBeInTheDocument()
    })

    it('should not include h1 headings in TOC', () => {
      const markdown = `# Main Title
## Section One
Content here.`
      const { container } = render(<GuidePanel markdown={markdown} />)

      // Should have TOC link for h2 but not h1
      expect(screen.getByRole('link', { name: 'Section One' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Main Title' })).not.toBeInTheDocument()
    })

    it('should handle markdown with no h2/h3 headings', () => {
      const markdown = `# Just H1
#### H4 Heading
Some content without h2 or h3.`
      render(<GuidePanel markdown={markdown} />)

      // Should render without errors, TOC will be empty
      expect(screen.getByText('Some content without h2 or h3.')).toBeInTheDocument()
    })
  })

  describe('Component Props', () => {
    it('should accept markdown as a prop', () => {
      const markdown = '## Test Section'
      render(<GuidePanel markdown={markdown} />)

      expect(screen.getByRole('heading', { level: 2, name: 'Test Section' })).toBeInTheDocument()
    })

    it('should handle empty markdown string', () => {
      render(<GuidePanel markdown="" />)

      // Should render without errors
      const component = screen.getByTestId('guide-panel')
      expect(component).toBeInTheDocument()
    })

    it('should handle very long markdown content', () => {
      const longMarkdown = Array(50)
        .fill(0)
        .map((_, i) => `## Section ${i}\n\nContent for section ${i}.\n\n`)
        .join('')

      render(<GuidePanel markdown={longMarkdown} />)

      // Should render first and last sections
      expect(screen.getByRole('heading', { level: 2, name: 'Section 0' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Section 49' })).toBeInTheDocument()
    })
  })
})
