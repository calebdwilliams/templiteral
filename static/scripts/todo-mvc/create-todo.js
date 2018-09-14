import { Component } from '../../templiteral.js';

export class CreateTodo extends Component {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  clearAll(event) {
    event.preventDefault();
    this.emit('all-completed', {});
  }

  saveTodo(event) {
    event.preventDefault();
    this.emit('todo-created', {
      title: this.refs.input.value,
      completed: false,
      id: Date.now()
    });
    this.refs.input.value = '';
  }

  render() {
    this.html`
    <style>
        
    </style>
    <form ref="todoForm" (submit)="${this.saveTodo}" autocomplete="off">
        <input type="text" id="create-todo" ref="input" placeholder="What needs to be done?">
    </form>
    <button class="mark-complete" (click)="${this.clearAll}">❯</button>
    `;
  }
}

!customElements.get('create-todo') && customElements.define('create-todo', CreateTodo);
