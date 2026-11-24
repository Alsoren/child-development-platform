// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import LinkedChildren from '../src/components/LinkedChildren';
import SpecialistPage from '../src/pages/SpecialistPage';
import { getChildren } from '../src/api/links';

vi.mock('../src/api/links', async (importOriginal) => ({
  ...(await importOriginal()),
  getChildren: vi.fn(),
}));

// Keep the page test about the child list only.
vi.mock('../src/components/WeeklySchedule', () => ({ default: ({ childId }) => <p>Schedule of child {childId}</p> }));
vi.mock('../src/components/TaskBoard', () => ({ default: ({ childId }) => <p>Tasks of child {childId}</p> }));

const ada = { id: 1, name: 'Ada' };
const ben = { id: 2, name: 'Ben' };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LinkedChildren', () => {
  it('shows each child and marks the selected one', () => {
    render(<LinkedChildren items={[ada, ben]} selectedId={2} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'Ada' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Ben' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onSelect with the id of the clicked child', () => {
    const onSelect = vi.fn();
    render(<LinkedChildren items={[ada, ben]} selectedId={1} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ben' }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('shows a message when no child is linked', () => {
    render(<LinkedChildren items={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('No children are linked to you yet.')).toBeInTheDocument();
  });
});

describe('SpecialistPage (US-M2-04)', () => {
  const renderPage = () => render(<MemoryRouter><SpecialistPage /></MemoryRouter>);

  it('lists exactly the linked children and opens the first one', async () => {
    getChildren.mockResolvedValue({ children: [ada, ben] });
    renderPage();

    expect(await screen.findByRole('button', { name: 'Ada' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Schedule of child 1')).toBeInTheDocument();
  });

  it('switches the schedule and tasks to the selected child', async () => {
    getChildren.mockResolvedValue({ children: [ada, ben] });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Ben' }));

    expect(screen.getByRole('button', { name: 'Ben' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Schedule of child 2')).toBeInTheDocument();
    expect(screen.getByText('Tasks of child 2')).toBeInTheDocument();
  });

  it('shows a message and no schedule when no child is linked', async () => {
    getChildren.mockResolvedValue({ children: [] });
    renderPage();

    expect(await screen.findByText('No children are linked to you yet.')).toBeInTheDocument();
    expect(screen.queryByText(/Schedule of child/)).not.toBeInTheDocument();
  });

  it('shows the API error when the list cannot be loaded', async () => {
    getChildren.mockRejectedValue(new Error('Request failed'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed');
    expect(screen.queryByText('No children are linked to you yet.')).not.toBeInTheDocument();
  });
});