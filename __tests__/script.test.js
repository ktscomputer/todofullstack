// countdown.test.js

// Mocking the global fetch function
global.fetch = jest.fn();

describe('Todo application functions', () => {
  
  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = `
      <div id="todosContainer"></div>
      <div id="countdownContainer"></div>
      <input id="todoDescription" value="Test Task" />
      <input id="taskDate" value="2024-09-01" />
      <input id="taskTime" value="12:00" />
      <div id="errorMessage"></div>
      <div id="noTodos" style="display: none;"></div>
    `;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('restoreCountdowns restores countdowns from localStorage', () => {
    const mockDeadline = new Date(Date.now() + 60000).toISOString();
    localStorage.setItem('countdown-1', mockDeadline);

    document.body.innerHTML = `
      <div id="todosContainer">
        <div id="todo-1"></div>
      </div>
    `;

    // Mock the startCountdown function
    const startCountdown = jest.fn();

    global.startCountdown = startCountdown;

    restoreCountdowns();

    expect(startCountdown).toHaveBeenCalledWith({
      _id: '1',
      datetime: mockDeadline,
    });
  });

  test('addTodo successfully adds a new todo', async () => {
    const mockResponse = { _id: '1', description: 'Test Task', datetime: '2024-09-01T12:00' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await addTodo();

    expect(fetch).toHaveBeenCalledWith('/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Test Task',
        datetime: '2024-09-01T12:00',
      }),
    });

    expect(document.getElementById('todoDescription').value).toBe('');
    expect(document.getElementById('taskDate').value).toBe('');
    expect(document.getElementById('taskTime').value).toBe('');
    expect(document.getElementById('noTodos').style.display).toBe('none');

    const todosContainer = document.getElementById('todosContainer');
    expect(todosContainer.querySelector('#todo-1')).not.toBeNull();
  });

  test('deleteTodo successfully removes a todo', async () => {
    document.body.innerHTML = `
      <div id="todosContainer">
        <div id="todo-1"></div>
        <div id="countdown-1"></div>
      </div>
    `;

    fetch.mockResolvedValueOnce({ ok: true });

    await deleteTodo('1');

    expect(fetch).toHaveBeenCalledWith('/todos/1', { method: 'DELETE' });
    expect(document.getElementById('todo-1')).toBeNull();
    expect(document.getElementById('countdown-1')).toBeNull();
    expect(countdownInterval.has('1')).toBe(false);
  });

  test('toggleTodo updates the todo completion status', async () => {
    document.body.innerHTML = `
      <div id="todosContainer">
        <div id="todo-1">
          <span></span>
        </div>
      </div>
    `;

    fetch.mockResolvedValueOnce({ ok: true });

    await toggleTodo('1', true);

    expect(fetch).toHaveBeenCalledWith('/todos/toggle/1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });

    const todoSpan = document.querySelector('#todo-1 span');
    expect(todoSpan.classList.contains('completed')).toBe(true);
  });

  test('addedTodoToList adds a todo and starts countdown', () => {
    const mockTodo = { _id: '1', description: 'Test Task', datetime: '2024-09-01T12:00' };
    const startCountdown = jest.fn();

    global.startCountdown = startCountdown;

    addedTodoToList(mockTodo);

    const todosContainer = document.getElementById('todosContainer');
    expect(todosContainer.querySelector('#todo-1')).not.toBeNull();
    expect(startCountdown).toHaveBeenCalledWith(mockTodo);
  });

  test('saveCountdownState saves countdown to localStorage', () => {
    const deadline = new Date().toISOString();
    saveCountdownState('1', deadline);

    expect(localStorage.getItem('countdown-1')).toBe(deadline);
  });

  test('loadCountdownState loads countdown from localStorage', () => {
    const deadline = new Date().toISOString();
    localStorage.setItem('countdown-1', deadline);

    const result = loadCountdownState('1');

    expect(result.toISOString()).toBe(deadline);
  });

  test('displayNoTasksMessage displays no tasks message when there are no todos', () => {
    displayNoTasksMessage();
    const noTasksMessage = document.getElementById('noTodos');
    expect(noTasksMessage.style.display).toBe('block');
  });
});
