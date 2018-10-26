import { Component } from '../../templiteral.js';

export class TodoFooter extends Component {
  static get boundAttributes() { return ['filter', 'remaining']; }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      filter: this.getAttribute('filter') || 'all',
      remaining: this.getAttribute('remaining') || 0
    };
  }
  
  setFilter(type) {
    this.setState({ filter: type });
    this.emit('set-filter', { type: type });
  }
  
  render() {
    this.html`
        <style>
          .todo-footer {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            position: relative;
            z-index: 3;
          }
          .todo-footer:before {
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2), 0 8px 0 -3px #f6f6f6, 0 9px 1px -3px rgba(0, 0, 0, 0.2), 0 16px 0 -6px #f6f6f6, 0 17px 2px -6px rgba(0, 0, 0, 0.2);
            content: "";
            height: 50px;
            overflow: hidden;
            position: absolute;
              right: 0;
              bottom: 0;
              left: 0;
            z-index: -1;
          }
          .filter {
            display: flex;
          }
          .filter button {
            background: transparent;
            border: 0;
            color: inherit;
            cursor: pointer;
            padding: 3px 7px;
          }
          .filter button.active {
            border: 1px solid rgba(175, 47, 47, 0.2);
            border-radius: 4px;
          }
          .filter button:focus {
            border: 2px solid #cc9a9a;
            outline: 0;
          }
          .clear-completed {
            display: flex;
            justify-content: flex-end;
          }
          .clear-completed button {
            border: 0;
            border-radius: 4px;
            background: transparent;
            color: inherit;
          }
          .clear-completed button:focus {
            border: 2px solid #cc9a9a;
            outline: 0;
          }
        </style>
        <footer class="todo-footer">
          <div>${this.state.remaining === '1' ? `${this.state.remaining} item` : `${this.state.remaining} items`} left</div>
          <div class="filter">
            <button (click)="${() => this.setFilter('all')}" class="${this.state.filter === 'all' ? 'active' : ''}">All</button>
            <button (click)="${() => this.setFilter('active')}" class="${this.state.filter === 'active' ? 'active' : ''}">Active</button>
            <button (click)="${() => this.setFilter('completed')}" class="${this.state.filter === 'completed' ? 'active' : ''}">Completed</button>
          </div>
          <div class="clear-completed">
            <button (click)="${() => this.emit('clear-completed')}">Clear completed</button>
          </div>
        </footer>
      `;
  }
}

!customElements.get('todo-footer') && customElements.define('todo-footer', TodoFooter);
