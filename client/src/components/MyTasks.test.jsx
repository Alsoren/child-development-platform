import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyTasks from './MyTasks';
import { completeTask, getWeekTasks } from '../api/tasks';

vi.mock('../api/tasks', () => ({ getWeekTasks: vi.fn(), completeTask: vi.fn() }));

const pending = {
  id: 1, title: 'Read a picture book', description: 'Ten minutes', developmentArea: 'Language',
  dueDate: '2026-11-17', status: 'pending', completedAt: null,
};
const done = {
  id: 2, title: 'Brush teeth', description: null, developmentArea: 'Motor',
  dueDate: '2026-11-18', status: 'done', completedAt: '2026-11-18 07:30:00',
};
const markButtons = () => screen.queryAllByRole('button', { name: /mark .* as done/i });

beforeEach(() => {
  vi.clearAllMocks();
  getWeekTasks.mockResolvedValue({ weekStart: '2026-11-16', weekEnd: '2026-11-22', tasks: [pending, done] });
});

describe('MyTasks', () => {
  it("shows the child's tasks of the week and a button only on pending tasks", async () => {
    render(<MyTasks childId={5} />);
    await screen.findByText('Read a picture book');
    expect(screen.getByText('Brush teeth')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(markButtons()).toHaveLength(1);
    expect(getWeekTasks).toHaveBeenCalledWith(5, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });

  it('marks a task as done and updates the list', async () => {
    completeTask.mockResolvedValue({ task: { ...pending, status: 'done', completedAt: '2026-11-17 09:00:00' } });
    render(<MyTasks childId={5} />);
    fireEvent.click(await screen.findByRole('button', { name: /read a picture book/i }));

    await waitFor(() => expect(completeTask).toHaveBeenCalledWith(5, 1));
    await waitFor(() => expect(markButtons()).toHaveLength(0));
    expect(screen.getAllByText('Done')).toHaveLength(2);
  });

  it('shows the error when the API refuses and keeps the task pending', async () => {
    completeTask.mockRejectedValue(new Error('Only the child can mark a task as done.'));
    render(<MyTasks childId={5} />);
    fireEvent.click(await screen.findByRole('button', { name: /read a picture book/i }));

    expect((await screen.findByRole('alert')).textContent).toBe('Only the child can mark a task as done.');
    expect(markButtons()).toHaveLength(1);
  });

  it('says so when there are no tasks this week', async () => {
    getWeekTasks.mockResolvedValue({ weekStart: '2026-11-16', weekEnd: '2026-11-22', tasks: [] });
    render(<MyTasks childId={5} />);
    expect(await screen.findByText('No tasks this week.')).toBeTruthy();
  });

  it('loads the previous week when "Previous week" is clicked', async () => {
    render(<MyTasks childId={5} />);
    await screen.findByText('Read a picture book');
    const firstWeek = getWeekTasks.mock.calls[0][1];
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    await waitFor(() => expect(getWeekTasks).toHaveBeenCalledTimes(2));
    expect(getWeekTasks.mock.calls[1][1]).not.toBe(firstWeek);
  });
});
