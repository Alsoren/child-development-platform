// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import LinkedSpecialists from '../src/components/LinkedSpecialists';
import { getLinkedSpecialists, linkSpecialist } from '../src/api/links';

vi.mock('../src/api/links', async (importOriginal) => ({
  ...(await importOriginal()),
  getLinkedSpecialists: vi.fn(),
  linkSpecialist: vi.fn(),
}));

const teacher = { specialistId: 2, name: 'Demo Teacher', email: 'teacher@example.com', type: 'teacher' };

describe('LinkedSpecialists', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists each linked specialist with name, email and type (US-M2-02)', async () => {
    getLinkedSpecialists.mockResolvedValue({ specialists: [teacher] });
    render(<LinkedSpecialists childId={1} />);

    expect(await screen.findByText('Demo Teacher')).toBeInTheDocument();
    expect(screen.getByText('teacher@example.com · teacher')).toBeInTheDocument();
    expect(getLinkedSpecialists).toHaveBeenCalledWith(1);
  });

  it('shows a message when no specialist is linked', async () => {
    getLinkedSpecialists.mockResolvedValue({ specialists: [] });
    render(<LinkedSpecialists childId={1} />);
    expect(await screen.findByText('No specialists linked yet.')).toBeInTheDocument();
  });

  it('shows an error when the list cannot be loaded', async () => {
    getLinkedSpecialists.mockRejectedValue(new Error('You are not allowed to access this child.'));
    render(<LinkedSpecialists childId={1} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('You are not allowed to access this child.');
  });

  it('links a specialist by email and type and adds it to the list (US-M2-01)', async () => {
    getLinkedSpecialists.mockResolvedValue({ specialists: [] });
    linkSpecialist.mockResolvedValue({ link: { ...teacher, type: 'coach' } });
    render(<LinkedSpecialists childId={1} />);
    await screen.findByText('No specialists linked yet.');

    fireEvent.change(screen.getByLabelText('Specialist email'), { target: { value: 'teacher@example.com' } });
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'coach' } });
    fireEvent.click(screen.getByRole('button', { name: 'Link specialist' }));

    expect(await screen.findByText('teacher@example.com · coach')).toBeInTheDocument();
    expect(linkSpecialist).toHaveBeenCalledWith(1, 'teacher@example.com', 'coach');
    expect(screen.getByLabelText('Specialist email')).toHaveValue('');
  });

  it('shows the API error for an unregistered email and adds nothing (US-M2-01)', async () => {
    getLinkedSpecialists.mockResolvedValue({ specialists: [] });
    linkSpecialist.mockRejectedValue(new Error('No registered specialist with this email.'));
    render(<LinkedSpecialists childId={1} />);
    await screen.findByText('No specialists linked yet.');

    fireEvent.change(screen.getByLabelText('Specialist email'), { target: { value: 'nobody@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Link specialist' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No registered specialist with this email.');
    expect(screen.getByText('No specialists linked yet.')).toBeInTheDocument();
  });
});