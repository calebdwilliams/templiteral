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
        :host {
            background: #fff;
            display: block;
            position: relative;
        }
        form {
            box-shadow: inset 0 -2px 1px rgba(0,0,0,0.03);
            display: flex;
        }
        input {
            background: rgba(0, 0, 0, 0.0003);
            box-sizing: border-box;
            border: none;
            flex: 1 1 auto;
            font-size: 1.5rem;
            padding: 1rem 1rem 1rem 3.37rem;
            width: 100%;
        }
        input::placeholder {
            /* color: ##e6e6e6; */
            font-style: italic;
            font-weight: 300;
        }
        .mark-complete {
            background: transparent;
            color: #737373;
            cursor: pointer;
            border: 0;
            font-size: 1.5rem;
            position: absolute;
                top: 1rem;
                left: 1rem;
            transform: rotate(90deg);
            transition: color 0.2s ease-in-out;
        }
        .mark-complete:hover {
            color: #121212;
        }
    </style>
    <form ref="todoForm" (submit)="${this.saveTodo}" autocomplete="off">
        <input type="text" id="create-todo" ref="input" placeholder="What needs to be done?">
    </form>
    <button class="mark-complete" (click)="${this.clearAll}">❯</button>
    `;
  }
}

!customElements.get('create-todo') && customElements.define('create-todo', CreateTodo);
