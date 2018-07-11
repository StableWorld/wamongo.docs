/* eslint-disable no-console,no-underscore-dangle, no-use-before-define, func-names
*/

function dbAddTask(text) {
  return wamongo.db().collection('tasks').insertOne({
    userID: wamongo.auth().currentUser.uid, complete: false, text,
  });
}

function dbUpdateTaskText(_id, text) {
  return wamongo.db().collection('tasks').updateOne(
    { _id },
    { $set: { text } },
  );
}

function dbUpdateTaskCompleteness(_id, complete) {
  return wamongo.db().collection('tasks').updateOne(
    { _id },
    { $set: { complete: !!complete } },
  );
}

function dbDeleteTask(_id) {
  console.log('deleet task');
  return wamongo.db().collection('tasks').deleteOne({ _id });
}

function dbFetchTasks() {
  return wamongo.db().collection('tasks').find({
    userID: wamongo.auth().currentUser.uid,
  }, { sort: [['complete', 1], ['text', 1]] });
}

// ----
// Define static elements
const signInButton = document.getElementById('sign-in-button');
const logoutButton = document.getElementById('logout-button');
const splashPage = document.getElementById('page-splash');
const addTaskButton = document.getElementById('add-task-button');
const taskHolder = document.getElementById('tasks');
const dialog = document.getElementsByTagName('dialog')[0];
const closeTaskDialogButton = document.getElementById('close-dialog');
const saveTaskDialogButton = document.getElementById('save-dialog');
// ----

/**
 * THis function clears the task list items and fetches new ones
*/
function refreshTasks() {
  dbFetchTasks().then((tasks) => {
    console.log('tasks', tasks);
    taskHolder.innerHTML = '';
    tasks.forEach((task) => {
      const listItem = createNewTaskElement(task);
      taskHolder.appendChild(listItem);
    });
    // material design upgrade dom
    componentHandler.upgradeElements(taskHolder);
  });
}

function htmlTaskItemTemplate(task) {
  return `
    <span class="mdl-list__item-secondary-action">
      <label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="checkbox-${task._id}">
        <input
          type="checkbox"
          id="checkbox-${task._id}"
          class="mdl-checkbox__input"
          ${task.complete ? 'checked' : ''}
        />
      </label>
    </span>
    <span class="mdl-list__item-primary-content text-content">
      <span class="hide-on-edit text-value">${task.text}</span>
      <div class="mdl-textfield compact show-on-edit mdl-js-textfield mdl-textfield--floating-label">
        <input class="mdl-textfield__input" type="text" value="${task.text}">
        <label class="mdl-textfield__label" for="sample3"></label>
      </div>
    </span>
    <span class="mdl-list__item-secondary-action">
      <button class="edit-button mdl-button hide-on-edit mdl-js-button mdl-button--icon">
        <i class="material-icons">edit</i>
      </button>
      <button class="save-button mdl-button show-on-edit mdl-js-button mdl-button--icon">
        <i class="material-icons">save</i>
      </button>
      <button class="delete-button mdl-button mdl-js-button mdl-button--icon">
        <i class="material-icons">delete_forever</i>
      </button>
    </span>
  `;
}
// New task list item
function createNewTaskElement(task) {
  const listItem = document.createElement('li');
  listItem.classList.add('mdl-list__item');
  listItem.classList.add('save');
  if (task.complete) {
    listItem.classList.add('complete');
  }
  listItem.id = task._id.toHexString();
  listItem.innerHTML = htmlTaskItemTemplate(task);

  listItem.querySelector('input[type=checkbox]').onchange = function (e) {
    const completed = e.target.checked;
    dbUpdateTaskCompleteness(task._id, completed).then(() => {
      refreshTasks();
    });
  };

  listItem.querySelector('button.edit-button').onclick = function () {
    listItem.classList.replace('save', 'edit');
    listItem.querySelector('input[type=text]').focus();
  };

  listItem.querySelector('button.save-button').onclick = function () {
    listItem.classList.replace('edit', 'save');
    const newText = listItem.querySelector('input[type=text]').value;
    dbUpdateTaskText(task._id, newText).then(refreshTasks);
  };

  listItem.querySelector('button.delete-button').onclick = function () {
    dbDeleteTask(task._id).then(refreshTasks);
  };

  return listItem;
}

function start() {
  signInButton.onclick = function () {
    console.log('logging in');
    wamongo.ui().startLogin();
  };

  logoutButton.onclick = function (e) {
    e.preventDefault();
    wamongo.auth().logout();
  };

  // Event handling, uder interaction is what starts the code execution.

  addTaskButton.onclick = function () {
    dialog.showModal();
  };

  closeTaskDialogButton.onclick = function () {
    dialog.querySelector('input').value = '';
    dialog.close();
  };

  saveTaskDialogButton.onclick = function () {
    const taskText = dialog.querySelector('input').value;
    dialog.querySelector('input').value = '';
    dbAddTask(taskText).then(refreshTasks);
    dialog.close();
  };

  wamongo.auth().on('AuthStateChanged', (user) => {
    console.log('splashPage.style.display', splashPage.style.display);
    if (user && user.email) {
      splashPage.style.display = 'none';
      refreshTasks();
    } else {
      splashPage.style.display = null;
    }
  });


  wamongo.auth().refresh().finally(() => {
    document.getElementById('wait-to-sign-in').style.display = 'none';
    document.getElementById('sign-in-button').style.display = null;
  });
}

start();
