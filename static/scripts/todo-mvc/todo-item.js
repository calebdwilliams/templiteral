import { Component } from '../../templiteral.js';

export class TodoItem extends Component {
  static get boundAttributes() { return ['title', 'completed', 'edit']; }
    
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = {
      edit: false,
      title: this.getAttribute('title'),
      completed: this.hasAttribute('completed')
    };
  }
  
  deleteTodo() {
    this.emit('delete-todo');
  }
  
  toggle(event) {
    event.preventDefault();
    this.state.edit = !this.state.edit;
  }
  
  toggleTodo(event) {
    this.emit('state-change', { completed: event.target.checked });
  }
  
  updateTitle(event) {
    this.emit('title-change', { newTitle: event.target.value });
  }
  
  render() {
    this.html`
        <style>
          :host {
            background: #fff;
            border-bottom: 1px solid #ededed;
            font-size: 1.5rem;
            display: block;
            position: relative;
          }
          .hidden {
            display: none;
          }
          form {
            display: flex;
          }
          .completed {
            height: 40px;
          }
          input[type="checkbox"] {
            position: absolute;
              left: -9999px;
          }
          input[type="checkbox"] + .checkbox:before {
            border: 1px solid #ededed;
            border-radius: 50%;
            content: "";
            cursor: pointer;
            display: block;
            margin: 10px;
            height: 30px;
            transition: background border-color 0.2s ease-in-out;
            width: 30px;
          }
          input[type="checkbox"]:checked + .checkbox:before {
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-10 -18 100 135"><path fill="#5dc2af" d="M72 25L42 71 27 56l-4 4 20 20 34-52z"/></svg>');
            border-color: #bddad5;
            background-position: -8px center;
            background-repeat: no-repeat;
          }
          input[type="checkbox"]:focus + .checkbox:before {
            border: 2px solid #5dc2af;
          }
          input[type="checkbox"]:active + .checkbox:before {
            background: #ededed;
            border: 2px solid #5dc2af;
          }
          .sr-only {
            position: absolute;
              left: -9999px;
          }
          .edit-todo, .todo-title {
              background: transparent;
              border: 0;
              color: #cc9a9a;
              flex: 1 1 auto;
              font-size: 1.5rem;
              font-weight: 300;
              text-align: left;
              transition: all 0.2s ease-in-out;
          }
          .todo-completed { 
            color: #d9d9d9;
            text-decoration: line-through;
          }
          .delete-todo {
            background: transparent;
            border: 0;
            color: #cc9a9a;
            cursor: pointer;
            font-size: 1.5rem;
            opacity: 0;
            padding: 0 1rem 0 0;
          }
          form:hover .delete-todo {
            opacity: 1;
          }
        </style>
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
