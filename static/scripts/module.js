import { Component } from '../templiteral.js';

class MyEl extends Component {
  static get tagName() { return 'my-el'; }
  static get boundAttributes() {
    return ['abc', 'username', 'pContentEditable'];
  }
  static get boundProps() {
    return ['todos'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.pContentEditable = false;
    this.hello = 'abc';
    this.username = 'everyone';
    this.abc = 'no one';
    this.todos = [
      {
        title: 'Code stuff',
        completed: false
      },
      {
        title: 'Test code',
        completed: false
      },
      {
        title: 'Buy eggs',
        completed: false
      }
    ];
  }

  get buttonMessage() {
    return this.username === 'world' ? 'Set name to everyone' : 'Set name to world';
  }

  addTodo(event) {
    event.preventDefault();
    this.todos.push({
      title: this.refs.todoTitle.value,
      completed: false
    });
    this.refs.todoTitle.value = '';
  }

  completed(event) {
    console.log(event);
  }

  toggleContentEditable() {
    this.pContentEditable = !this.pContentEditable;
  }

  toggleName(event) {
    event.preventDefault();
    if (this.username === 'everyone') {
      this.username = 'world';
    } else {
      this.username = 'everyone';
    }
  }

  update(event) {
    event.preventDefault();
    this.username = this.refs.input.value;
  }

  updateName() {
    this.username = this.refs.input.value;
  }

  render() {
    this._ = this.html`
      <style>
        * {
          font-family: Helvetica, Times;
        }
        .everyone {
          color: tomato;
        }
        .someone {
          color: rebeccapurple;
        }
        .world {
          color: mediumaquamarine;
        }
        [contenteditable] {
          border: 1px dotted #1a1a1a;
          border-right: 5px solid #bada55;
          padding: 5px;
          transition: all 0.2s ease;
        }
        .completed {
          text-decoration: line-through;
        }
      </style>
      
      <h1 class="${this.username} arbitrary">Things ${this.username} needs to do</h1>

      <btn-btn>Test</btn-btn>

      <form (submit)="${this.addTodo}">
        <fieldset>
          <legend>Create a to-do</legend>

          <label for="title">To-do title</label>
          <input id="title" name="title" type="text" ref="todoTitle" required>

          <button>Add to-do</button>

          <ul>
            ${this.todos.map(todo => this.fragment(todo.title)`
              <to-do [title]="${todo.title}" [completed]="${todo.completed}" [todo]="${todo}" (completed)="${this.completed}"></to-do>
            `)}
          </ul>
        </fieldset>
      </form>

      <p [contentEditable]="${this.pContentEditable}">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sapien magna, aliquet non massa dapibus, convallis porta sem. Phasellus laoreet, turpis et feugiat malesuada, quam magna tincidunt diam, at tempor sapien nisl nec elit. Curabitur suscipit mi eu dolor tempor luctus eu vel tortor. Username is ${this.username}, and there are currently ${this.todos.length} to dos listed.</p>

      <p>Vivamus efficitur nulla nec nulla faucibus ultricies. Sed sed lacus vel nisl mattis aliquet quis rhoncus magna. Etiam aliquam eget leo nec tincidunt. Mconaecenas lacinia consectetur augue, vitae euismod augue eleifend quis. Mauris et aliquam velit.</p>

      <p>Quisque sit amet lorem in mauris viverra facilisis. Vestibulum pharetra elit eget eleifend tempor.</p>

      <form (submit)="${this.update}">
        <label for="username">User name</label>
        <input id="username" type="text" name="username" (input)="${this.updateName}" ref="input">

        <button>Submit</button>
      </form>

      <button (click)="${this.toggleName}">${this.buttonMessage}</button>
      <button (click)="${this.toggleContentEditable}">Toggle content editable</button>
    `;
  }
}

customElements.define(MyEl.tagName, MyEl);

class ToDo extends Component {
  static get boundAttributes() {
    return ['title', 'completed'];
  }

  static get boundProps() {
    return ['todo'];
  }

  done() {
    this.todo.completed = !this.todo.completed;
    const completed = new CustomEvent('completed', {
      detail: {
        todo: this.todo
      }
    });
    this.dispatchEvent(completed);
  }

  render() {
    this.html`
      <li class="${this.completed ? 'completed' : 'incomplete'}">
        <label>
          <input type="checkbox" [value]="${this.todo.completed}" (change)="${this.done}">
          ${this.todo.title}
        </label>
      </li>
    `;
  }
}

customElements.define('to-do', ToDo);

customElements.define('btn-btn', class extends Component {
  static get boundAttributes() {
    return ['disabled'];
  }

  static get mapStateToProps() {
    return ['disabled'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = {
      disabled: this.hasAttribute('disabled')
    }
  }

  render() {
    this.html`<button [disabled]="${this.state.disabled}"><slot></slot></button>`;
  }
});