const countdownInterval = new Map();

// ### 2.Restore countdowns on page load
  function restoreCountdowns() {
  const todos = document.querySelectorAll('#todosContainer div')
  todos.forEach(todoDiv => {
      const todoId = todoDiv.id.replace('todo -', '')
      const deadline = loadCountdownState(todoId)
      if (deadline) {
          startCountdown({ _id: todoId, datetime: deadline.toISOString() })
      }
  })
}

// ###  3. Add new Task ###
 async function addTodo() {
  try {
      const description = document.getElementById('todoDescription').value;
      const taskDate = document.getElementById('taskDate').value;
      const taskTime = document.getElementById('taskTime').value;
      const errorMessage = document.getElementById("errorMessage")

      if (!description) {
          errorMessage.textContent = "Task cannot be blank!";
          return;
      }

      if (!taskDate || !taskTime) {
          errorMessage.textContent = "Date and Time are required!";
          return;
      }

      const datetime = `${taskDate}T${taskTime}`;
      const response = await fetch('/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, datetime })
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to add task: ${errorText}`);
      }
      const addedTodo = await response.json();
      console.log('Added new todo:', addedTodo);

      //### clearing input fields ###

      document.getElementById('todoDescription').value = '';
      document.getElementById('taskDate').value = '';
      document.getElementById('taskTime').value = '';

      addedTodoToList(addedTodo);
      document.getElementById('noTodos').style.display = 'none';
  } catch (error) {
      console.error('Failed adddToDo :', error.message);
      alert(`Failed adddToDo: ${error.message}`);
  }
}
// ### 4.Delete Tasks ###
  async function deleteTodo(todoId) {
  const isConfirmed = confirm("Are you sure you want to delete this task?")
  if (!isConfirmed) {
      return
  }
  try {
      const response = await fetch(`/todos/${todoId}`, {
          method: 'DELETE',
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete todo: ${errorText}`);
      }

      const todoDiv = document.getElementById(`todo-${todoId}`);
      if (todoDiv) {
          todoDiv.remove();
      }

      if(countdownInterval.has(todoId)){
          clearInterval(countdownInterval.get(todoId))
          countdownInterval.delete(todoId)
      }
     
      const countdownDiv =document.getElementById(`countdown-${todoId}`)
      if(countdownDiv){
          countdownDiv.remove()
      }

      const remainingTodos = document.querySelectorAll('#todosContainer > div');
      if (remainingTodos.length === 0) {
          displayNoTasksMessage();
      }
      console.log('Todo deleted successfully');
  } catch (error) {
      console.error('Error deleting todo:', error.message);
      alert(`Failed to delete todo: ${error.message}`);
  }
}
// ### 5. Function to toggle the completion status of a todo
 async function toggleTodo(todoId, completed) {
  try {
      console.log(`Toggling todo ${todoId} to ${completed}`);
      const response = await fetch(`/todos/toggle/${todoId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed })
      });
      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to toggle todo: ${errorText}`);
      }

      const todoDiv = document.getElementById(`todo-${todoId}`);
      const todoSpan = todoDiv.querySelector('span');

      if (!todoSpan) {
          throw new Error(`Span element not found for todo ${todoId}`);
      }

      if (completed) {
          todoSpan.classList.add('completed');
      } else {
          todoSpan.classList.remove('completed');
      }

      console.log('Todo toggled successfully');
  } catch (error) {
      console.error('Error toggling todo:', error.message);
      alert(`Failed to toggle todo: ${error.message}`);
  }
}
// ### 6.Add todo to the list and start countdown
 function addedTodoToList(todo) {
  const todosContainer = document.getElementById('todosContainer');
  const newTodoDiv = document.createElement('div');
  newTodoDiv.id = `todo-${todo._id}`;

  const newTodoLabel = document.createElement('label');
  const newTodoCheckbox = document.createElement('input');
  newTodoCheckbox.type = 'checkbox';
  newTodoCheckbox.onchange = function () { toggleTodo(todo._id, this.checked); };

  const newTodoSpan = document.createElement('span');
  newTodoSpan.textContent = todo.description;
  newTodoLabel.appendChild(newTodoCheckbox);
  newTodoLabel.appendChild(newTodoSpan);

  newTodoDiv.appendChild(newTodoLabel);

  const deleteIcon = document.createElement('i');
  deleteIcon.className = 'fas fa-trash delete-icon';
  deleteIcon.onclick = function () { deleteTodo(todo._id); };
  newTodoDiv.appendChild(deleteIcon);

  todosContainer.appendChild(newTodoDiv);

  startCountdown(todo);

}
// ### 7.Update countdown

 function updateCountdown(todo) {
  const now = new Date();
  const deadline = new Date(todo.datetime)
  const countdownDiv = document.getElementById(`countdown-${todo._id}`)
   
  if(!countdownDiv){
      return;
  }
      const timeRemaining= deadline - now;
  if (timeRemaining <= 0) {
      countdownDiv.textContent = "Time's up!";
      countdownDiv.classList.add('time-up')
      clearInterval(countdownInterval.get(todo._id));
      countdownInterval.delete(todo._id);
      return;
  }

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  countdownDiv.textContent = `${minutes}m ${seconds}s remaining`;
}
// ### 8 .Start countdown

 function startCountdown(todo) {
  const now = new Date();
  const deadline = new Date(todo.datetime);
  const wakeTime = 15 * 60 * 1000;
  const countdownStart = new Date(deadline-wakeTime)

  if(now >= deadline){
      document.getElementById(`countdown-${todo._id}`).textContent = "Time's up !"
      return;
  }
  if (now < countdownStart){
      const timeUntilCountdown = countdownStart -now;
      setTimeout(()=> startCountdown(todo),timeUntilCountdown);
       return;
  }

  const countdownDiv = document.createElement('div');
  countdownDiv.id = `countdown-${todo._id}`;
  countdownDiv.className = 'countdown-item';

  const taskNameSpan = document.createElement('span')
  taskNameSpan.textContent = `${todo.description}`;
  countdownDiv.appendChild(taskNameSpan);

  const timerSpan = document.createElement('span')
  timerSpan.id = `timer-${todo._id}`;
  countdownDiv.appendChild(timerSpan);

  document.getElementById('countdownContainer').appendChild(countdownDiv);

  updateCountdown(todo);

  countdownInterval[todo._id] = setInterval(() => updateCountdown(todo), 1000);

  saveCountdownState(todo._id, deadline);
}
// ### 8.load todos form server 
 async function loadTodos() {
try {
const response = await fetch('/todos');
if (!response.ok) {
  throw new Error('Failed to load todos');
}
const todos = await response.json();
const todosContainer = document.getElementById('todosContainer');
todosContainer.innerHTML = '';

todos.forEach(todo => addedTodoToList(todo));

// Check if there are no todos
if (todos.length === 0) {
  displayNoTasksMessage();
  }
} catch (err) {
  console.error("Error loading todos:", err.message); 
  }
}

//### 9 .Save to local storage 

 function saveCountdownState(todoId, deadline) {
  localStorage.setItem(`countdown-${todoId}`, deadline.toString())
}
//### 10. load countdown
 function loadCountdownState(todoId) {
  const deadlineISOString = localStorage.getItem(`countdown-${todoId}`)
  return deadlineISOString ? new Date(deadlineISOString) : null
}
// ### 11.Display no taske deleting all task
 function displayNoTasksMessage()   {
  const noTasksMessage = document.getElementById('noTodos'); // Assuming you have a container for todos
  noTasksMessage.style.display= 'block';
}
//### 12.Restore countdown
window.onload =  function(){
  loadTodos();
  restoreCountdowns();
}
