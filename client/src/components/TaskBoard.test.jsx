import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskBoard from './TaskBoard';
import { addTask, getWeekTasks } from '../api/tasks';

vi.mock('../api/tasks', () => ({
  DEVELOPMENT_AREAS: ['Language', 'Motor', 'Social', 'Cognitive', 'Emotional'],
  getWeekTasks: vi.fn(),
  addTask: vi.fn(),
}));

const tasks = [
  { id: 1, title: 'Read a picture book', developmentArea: 'Language', dueDate: '2026-11-17', status: 'done' },
  { id: 2, title: 'Build a tower', developmentArea: 'Motor', dueDate: '2026-11-18', status: 'pending' },
];

beforeEach(() => {
  vi.clearAllMocks();
  getWeekTasks.mockResolvedValue({ weekStart: '2026-11-16', weekEnd: '2026-11-22', tasks });
});

const fillForm = ({ title, description, area, due }) => {
  fireEvent.change(screen.getByLabelText('Task title'), { target: { value: title } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: description } });
  fireEvent.change(screen.getByLabelText('Development area'), { target: { value: area } });
  fireEvent.change(screen.getByLabelText('Due date'), { target: { value: due } });
};

describe('TaskBoard', () => {
  it('shows the tasks of the week with their status (US-M4-03)', async () => {
    render(<TaskBoard childId={5} />);
    await screen.findByText('Read a picture book');
    expect(screen.getByText('Build a tower')).toBeTruthy();
    expect(screen.getByText('done')).toBeTruthy();
    expect(screen.getByText('pending')).toBeTruthy();
    expect(screen.getByText('2026-11-16 to 2026-11-22')).toBeTruthy();
  });

  it('assigns a task and reloads the week of its due date', async () => {
    addTask.mockResolvedValue({ task: {} });
    render(<TaskBoard childId={5} />);
    await screen.findByText('Read a picture book');

    fillForm({ title: 'Draw a house', description: 'Use crayons', area: 'Motor', due: '2026-11-25' });
    fireEvent.click(screen.getByRole('button', { name: 'Assign task' }));

    await waitFor(() =>
      expect(addTask).toHaveBeenCalledWith(5, {
        title: 'Draw a house', description: 'Use crayons', developmentArea: 'Motor', dueDate: '2026-11-25',
      })
    );
    await waitFor(() => expect(getWeekTasks).toHaveBeenLastCalledWith(5, '2026-11-25'));
    expect(screen.getByLabelText('Task title').value).toBe('');
  });

  it('shows the validation message from the API and keeps the form', async () => {
    addTask.mockRejectedValue(new Error('Due date must be a valid date (YYYY-MM-DD).'));
    render(<TaskBoard childId={5} />);
    await screen.findByText('Read a picture book');

    fillForm({ title: 'Draw a house', description: '', area: 'Motor', due: '2026-11-25' });
    fireEvent.click(screen.getByRole('button', { name: 'Assign task' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Due date must be a valid date (YYYY-MM-DD).');
    expect(screen.getByLabelText('Task title').value).toBe('Draw a house');
  });

  it('shows an error when the week cannot be loaded', async () => {
    getWeekTasks.mockRejectedValue(new Error("You are not allowed to access this child's tasks."));
    render(<TaskBoard childId={5} />);
    expect((await screen.findByRole('alert')).textContent).toBe("You are not allowed to access this child's tasks.");
  });
});
