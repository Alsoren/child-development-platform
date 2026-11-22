import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import UpcomingEvents from './UpcomingEvents';
import { getUpcomingEvents } from '../api/events';

vi.mock('../api/events', () => ({ getUpcomingEvents: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe('UpcomingEvents', () => {
  it("shows the child's upcoming events (US-M3-03)", async () => {
    getUpcomingEvents.mockResolvedValue({
      events: [{ id: 1, title: 'Swimming class', startAt: '2026-11-24 16:00', endAt: '2026-11-24 17:00' }],
    });
    render(<UpcomingEvents childId={5} />);
    await screen.findByText('Swimming class');
    expect(screen.getByText('2026-11-24 · 16:00 to 17:00')).toBeTruthy();
    expect(getUpcomingEvents).toHaveBeenCalledWith(5);
  });

  it('says so when nothing is coming up', async () => {
    getUpcomingEvents.mockResolvedValue({ events: [] });
    render(<UpcomingEvents childId={5} />);
    expect(await screen.findByText('No upcoming events.')).toBeTruthy();
  });

  it('shows the error from the API', async () => {
    getUpcomingEvents.mockRejectedValue(new Error("You are not allowed to access this child's events."));
    render(<UpcomingEvents childId={5} />);
    expect((await screen.findByRole('alert')).textContent).toBe("You are not allowed to access this child's events.");
  });
});
