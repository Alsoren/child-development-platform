import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SummaryCard from './SummaryCard';
import { createSummary, getSummary, sendFeedback } from '../api/summary';

vi.mock('../api/summary', () => ({
  getSummary: vi.fn(),
  createSummary: vi.fn(),
  sendFeedback: vi.fn(),
}));

const UNAVAILABLE = 'The AI summary is not available right now. Please try again later.';

const week = { weekStart: '2026-12-07', weekEnd: '2026-12-13' };
const summary = {
  id: 9,
  text: 'The child finished one of two tasks.',
  provider: 'mock',
  myFeedback: null,
  sources: [
    { type: 'task', id: 1, title: 'Read a picture book', dueDate: '2026-12-08' },
    { type: 'task', id: 2, title: 'Build a tower', dueDate: '2026-12-10' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  getSummary.mockResolvedValue({ ...week, summary: null });
});

describe('SummaryCard', () => {
  it('shows an empty state and the generate button when the week has no summary', async () => {
    render(<SummaryCard childId={5} />);

    expect(await screen.findByText('No summary for this week yet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Generate summary' })).toBeTruthy();
    expect(screen.getByText('2026-12-07 to 2026-12-13')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Helpful' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Incorrect' })).toBeNull();
  });

  it('generates a summary for the shown week and labels it (US-M8-03)', async () => {
    createSummary.mockResolvedValue({ summary });
    render(<SummaryCard childId={5} />);
    await screen.findByText('No summary for this week yet.');

    fireEvent.click(screen.getByRole('button', { name: 'Generate summary' }));

    expect(await screen.findByText('The child finished one of two tasks.')).toBeTruthy();
    expect(createSummary).toHaveBeenCalledWith(5, '2026-12-07');
    expect(screen.getByText('AI-generated')).toBeTruthy();
    expect(screen.getByText(/This is a suggestion, not a decision/)).toBeTruthy();
    expect(screen.getByText('Sample answer (mock mode)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Generate again' })).toBeTruthy();
    expect(screen.queryByText('No summary for this week yet.')).toBeNull();
  });

  it('lists the source records as links to their rows', async () => {
    getSummary.mockResolvedValue({ ...week, summary });
    render(<SummaryCard childId={5} />);

    const first = await screen.findByRole('link', { name: 'Read a picture book, due 2026-12-08' });
    expect(first.getAttribute('href')).toBe('#task-1');
    expect(screen.getByRole('link', { name: 'Build a tower, due 2026-12-10' }).getAttribute('href')).toBe('#task-2');
  });

  it('falls back to a plain label when a source has no title', async () => {
    getSummary.mockResolvedValue({ ...week, summary: { ...summary, sources: [{ type: 'task', id: 7, title: null, dueDate: null }] } });
    render(<SummaryCard childId={5} />);

    expect(await screen.findByRole('link', { name: 'Task 7' })).toBeTruthy();
  });

  it('says so when no records were available', async () => {
    getSummary.mockResolvedValue({ ...week, summary: { ...summary, sources: [] } });
    render(<SummaryCard childId={5} />);

    expect(await screen.findByText('No records were available for this week.')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('does not show the mock note for a real provider', async () => {
    getSummary.mockResolvedValue({ ...week, summary: { ...summary, provider: 'gemini' } });
    render(<SummaryCard childId={5} />);

    await screen.findByText('AI-generated');
    expect(screen.queryByText('Sample answer (mock mode)')).toBeNull();
  });

  it('sends feedback and marks the chosen button as pressed', async () => {
    getSummary.mockResolvedValue({ ...week, summary });
    sendFeedback.mockResolvedValue({ feedback: { summaryId: 9, rating: 'helpful' } });
    render(<SummaryCard childId={5} />);
    const helpful = await screen.findByRole('button', { name: 'Helpful' });
    expect(helpful.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(helpful);

    await waitFor(() => expect(sendFeedback).toHaveBeenCalledWith(9, 'helpful'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Helpful' }).getAttribute('aria-pressed')).toBe('true'));
    expect(screen.getByRole('button', { name: 'Incorrect' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the earlier vote and lets the reader change it', async () => {
    getSummary.mockResolvedValue({ ...week, summary: { ...summary, myFeedback: 'incorrect' } });
    sendFeedback.mockResolvedValue({ feedback: { summaryId: 9, rating: 'helpful' } });
    render(<SummaryCard childId={5} />);

    const incorrect = await screen.findByRole('button', { name: 'Incorrect' });
    expect(incorrect.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Helpful' }).getAttribute('aria-pressed')).toBe('true'));
    expect(screen.getByRole('button', { name: 'Incorrect' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the message when the feedback cannot be saved and keeps the old vote', async () => {
    getSummary.mockResolvedValue({ ...week, summary });
    sendFeedback.mockRejectedValue(new Error('Summary not found.'));
    render(<SummaryCard childId={5} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Helpful' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Summary not found.');
    expect(screen.getByRole('button', { name: 'Helpful' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the readable 502 message when the AI is not available and keeps the screen usable', async () => {
    createSummary.mockRejectedValue(new Error(UNAVAILABLE));
    render(<SummaryCard childId={5} />);
    await screen.findByText('No summary for this week yet.');

    fireEvent.click(screen.getByRole('button', { name: 'Generate summary' }));

    expect((await screen.findByRole('alert')).textContent).toBe(UNAVAILABLE);
    expect(screen.getByText('No summary for this week yet.')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate summary' }).disabled).toBe(false));
  });

  it('disables the button while the summary is being generated', async () => {
    let finish;
    createSummary.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<SummaryCard childId={5} />);
    await screen.findByText('No summary for this week yet.');

    fireEvent.click(screen.getByRole('button', { name: 'Generate summary' }));

    const busy = await screen.findByRole('button', { name: 'Generating…' });
    expect(busy.disabled).toBe(true);

    finish({ summary });
    await screen.findByText('The child finished one of two tasks.');
  });

  it('shows an error when the week cannot be loaded', async () => {
    getSummary.mockRejectedValue(new Error('You are not allowed to access this child.'));
    render(<SummaryCard childId={5} />);

    expect((await screen.findByRole('alert')).textContent).toBe('You are not allowed to access this child.');
    expect(screen.getByRole('button', { name: 'Generate summary' }).disabled).toBe(true);
  });
});
