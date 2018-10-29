import { Component } from '../../templiteral.js';

export class TodoItem extends Component {
  static get boundAttributes() { return ['title', 'completed', 'edit']; }
  static get booleanAttributes() { return ['completed']; }
    
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = {
      edit: false,
      title: this.getAttribute('title'),
      completed: this.hasAttribute('completed')
    };

    this.updatedHooks.set('completed', this.toggleComplete);
  }
  
  deleteTodo() {
    this.emit('delete-todo');
  }
  
  toggle(event) {
    event.preventDefault();
    this.state.edit = !this.state.edit;
  }

  toggleComplete(value, attr) {
    console.log({el: this, value, attr});
  }
  
  toggleTodo(event) {
    this.emit('state-change', { completed: event.target.checked });
  }
  
  updateTitle(event) {
    this.emit('title-change', { newTitle: event.target.value });
  }
  
  render() {
    this.html`
        <form (submit)="${this.toggle}" autocomplete="off">
          <input type="checkbox" id="completed" name="completed" class="completed" [checked]="${this.state.completed}" (change)="${this.toggleTodo}">
          <label for="completed" class="checkbox">
              <span class="sr-only">${this.state.title} completed</span>
          </label>
          <button (click)="${event => event.preventDefault()}" (dblclick)="${this.toggle}" class="edit-todo ${this.state.edit ? 'hidden' : ''} ${this.state.completed ? 'todo-completed' : ''}">${this.state.title}</button>
          <input type="text" name="todoTitle" id="todoTitle" value="${this.state.title}" class="todo-title ${this.state.edit ? '' : 'hidden'}" (change)="${this.updateTitle}" (blur)="${() => this.state.edit = false}" autofocus>
          <button class="delete-todo ${this.state.edit ? 'hidden' : ''}" (click)="${this.deleteTodo}">×</button>
        </form>
      `;
  }
}

!customElements.get('todo-item') && customElements.define('todo-item', TodoItem);
