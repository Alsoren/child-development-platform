import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeeklySchedule from './WeeklySchedule';
import { addEvent, getWeekEvents } from '../api/events';

vi.mock('../api/events', () => ({ getWeekEvents: vi.fn(), addEvent: vi.fn() }));

const events = [
  { id: 1, childId: 5, title: 'Swimming class', startAt: '2026-11-17 16:00', endAt: '2026-11-17 17:00' },
];

beforeEach(() => {
  vi.clearAllMocks();
  getWeekEvents.mockResolvedValue({ weekStart: '2026-11-16', weekEnd: '2026-11-22', events });
});

const fillForm = ({ title, date, start, end }) => {
  fireEvent.change(screen.getByLabelText('Event title'), { target: { value: title } });
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } });
  fireEvent.change(screen.getByLabelText('Start'), { target: { value: start } });
  fireEvent.change(screen.getByLabelText('End'), { target: { value: end } });
};

describe('WeeklySchedule', () => {
  it('lists the events of the week with date and time (US-M3-02)', async () => {
    render(<WeeklySchedule childId={5} />);
    await screen.findByText('Swimming class');
    expect(screen.getByText('2026-11-17 · 16:00 to 17:00')).toBeTruthy();
    expect(getWeekEvents).toHaveBeenCalledWith(5, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });

  it('says so when the week has no events', async () => {
    getWeekEvents.mockResolvedValue({ weekStart: '2026-11-16', weekEnd: '2026-11-22', events: [] });
    render(<WeeklySchedule childId={5} />);
    expect(await screen.findByText('No events this week.')).toBeTruthy();
  });

  it('adds an event with start and end on the chosen date and shows that week (US-M3-01)', async () => {
    addEvent.mockResolvedValue({ event: {} });
    render(<WeeklySchedule childId={5} />);
    await screen.findByText('Swimming class');

    fillForm({ title: 'Reading session', date: '2026-11-25', start: '10:00', end: '10:45' });
    fireEvent.click(screen.getByRole('button', { name: 'Add event' }));

    await waitFor(() =>
      expect(addEvent).toHaveBeenCalledWith(5, {
        title: 'Reading session', startAt: '2026-11-25 10:00', endAt: '2026-11-25 10:45',
      })
    );
    await waitFor(() => expect(getWeekEvents).toHaveBeenLastCalledWith(5, '2026-11-25'));
    expect(screen.getByLabelText('Event title').value).toBe('');
  });

  it('shows the validation message from the API and keeps the form', async () => {
    addEvent.mockRejectedValue(new Error('End time must be after the start time.'));
    render(<WeeklySchedule childId={5} />);
    await screen.findByText('Swimming class');

    fillForm({ title: 'Reading session', date: '2026-11-25', start: '11:00', end: '10:00' });
    fireEvent.click(screen.getByRole('button', { name: 'Add event' }));

    expect((await screen.findByRole('alert')).textContent).toBe('End time must be after the start time.');
    expect(screen.getByLabelText('Event title').value).toBe('Reading session');
  });
});
