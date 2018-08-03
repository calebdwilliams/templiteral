import { Component } from '../../templiteral.js';
import './create-todo.js';
import './todo-item.js';
import './todo-footer.js';

export class TodoMVC extends Component {
  static get boundAttributes() { return ['filter']; }

  constructor() {
    super();
    this.state = {
      todos: [{
        id: 0,
        title: 'Test',
        completed: false
      }, {
        id: 1,
        title: 'Completed',
        completed: true
      }],
      filter: this.getAttribute('filter') || 'all'
    };
  }

  get all() {
    return this.state.todos.map(this.todoMap, this);
  }

  get active() {
    return this.state.todos.filter(todo => !todo.completed).map(this.todoMap, this);
  }

  get completed() {
    return this.state.todos.filter(todo => todo.completed).map(this.todoMap, this);
  }

  get todoMap() {
    return (todo) => this.fragment(todo.id)`<todo-item title="${todo.title}" [completed]="${todo.completed}" (title-change)="${event => this.titleChange(todo, event.detail.newTitle)}" (state-change)="${event => this.toggleTodo(todo, event.detail.completed)}" (delete-todo)="${() => this.removeTodo(todo)}"></todo-item>`;
  }

  addTodo(event) {
    this.state.todos.push(event.detail);
  }

  allCompleted() {
    this.state.todos.forEach(todo => {
      todo.completed = true;
    });
  }

  changeFilter(event) {
    this.state.filter = event.detail.type;
  }

  clearCompleted() {
    this.state.todos = this.state.todos.filter(todo => !todo.completed);
  }

  removeTodo(todo) {
    const { id } = todo;
    const remove = this.state.todos.reduce((current, next) => current && current.id === id ? current : next, null);
    this.state.todos.splice(this.state.todos.indexOf(remove), 1);
  }

  titleChange(todo, newTitle) {
    todo.title = newTitle;
  }
  
  toggleTodo(todo, completed) {
    todo.completed = completed;
  }

  render() {
    return this.html`
        <style>
          todo-mvc {
            background: #fff;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 25px 50px 0 rgba(0, 0, 0, 0.1);
            display: block;
            position: relative;
          }
        </style>
        <create-todo (todo-created)="${this.addTodo}" (all-completed)="${this.allCompleted}"></create-todo>
        <section>
          ${this[this.state.filter]}
        </section>
        <todo-footer [todos]="${this.state.todos}" (set-filter)="${this.changeFilter}" filter="${this.state.filter}" (clear-completed)="${this.clearCompleted}" remaining="${this.state.todos.filter(todo => !todo.completed).length || '0'}"></todo-footer>
    `;
  }
}

!customElements.get('todo-mvc') && customElements.define('todo-mvc', TodoMVC);