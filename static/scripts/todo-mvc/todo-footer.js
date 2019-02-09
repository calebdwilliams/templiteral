import { Component } from '../../templiteral.js';
import { todoFooterStyles } from './styles.js';

export class TodoFooter extends Component {
  static get boundAttributes() { return ['filter', 'remaining']; }
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [todoFooterStyles];

    this.state = {
      filter: this.getAttribute('filter') || 'all',
      remaining: this.getAttribute('remaining') || 0
    };
  }
  
  setFilter(type) {
    this.state.filter = type;
    this.emit('set-filter', { type: type });
  }
  
  render() {
    this.html`
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
