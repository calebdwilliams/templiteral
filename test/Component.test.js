/* global templit describe beforeEach afterEach it expect */
let component;
const { Component } = templit;

// This necessarily takes time,
// no need to factor that in to tests
window.requestAnimationFrame = callback => callback();

describe('Component', () => {
  beforeEach(() => {
    class TestEl extends Component {
      static get boundAttributes() { return ['unit', 'works']; }
      static get booleanAttributes() { return ['works']; }
      static get boundProps() { return ['todos', 'works']; }
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.state = {
          todos: [{
            title: 'a',
            completed: false
          }, {
            title: 'b',
            completed: false
          }, {
            title: 'c',
            completed: false
          }]
        };
      }

      todoChange(todo, completed) {
        todo.completed = completed;
      }

      render() {
        this.html`
            <ul>
            ${this.state.todos
.filter(todo => !todo.completed)
.map(todo => this.fragment(todo.title)`
                    <to-do [title]="${todo.title}" [completed]="${todo.completed}" (todo-change)="${event => this.todoChange(todo, event.detail.checked)}"></to-do>
                `)
}
            </ul>
            <button ref="button" (click)="${event => this.emit('test-event', { event })}">Click me</button>
        `;
      }
    }

    class ToDo extends Component {
      static get boundAttributes() { return ['title', 'completed']; }
      constructor() {
        super();
        this.state = {
          title: this.getAttribute('title'),
          completed: this.hasAttribute('completed') || false
        };
      }
      render() {
        this.html`
                    <li>
                        <label>
                            <input type="checkbox" [checked]="${this.state.completed}" (change)="${event => this.emit('todo-change', { completed: event.target.checked })}">
                            ${this.title}
                        </label>
                    </li>
                `;
      }
    }

    customElements.get('to-do') || customElements.define('to-do', ToDo);
    customElements.get('test-el') || customElements.define('test-el', TestEl);
  });

  beforeEach(() => {
    component = document.createElement('test-el');
    component.setAttribute('unit', 'karma');
    component.setAttribute('works', '');
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
    component = null;
  });

  describe('Core Features', () => {
    it('Constructs a Component', () => {
      expect(component instanceof Component).toBe(true);
    });
        
    it('Has a templiteral instance', () => {
      expect(component.templiteral).toBeDefined();
    });
    
    it('Has an html method', () => {
      expect(component.html).toBeDefined();
    });
    
    it('Has an emit method', () => {
      expect(component.emit).toBeDefined();
    });

    it('Has an fragment method', () => {
      expect(component.fragment).toBeDefined();
    });
    
    it('Has a default renderer', () => {
      expect(component.constructor.renderer).toBe('render');
    });

    it('Manages bound attributes', () => {
      expect(component.unit).toBe('karma');
    });

    it('Manages named attributes', () => {
      console.log(component.works, component.hasAttribute('works'), component);
      expect(component.works).toBeTruthy();
    });
  });

  describe('Emit', () => {
    let click = new Event('click');
    beforeEach(() => {
      spyOn(component, 'emit').and.callThrough();
    });

    it('should emit', () => {
      component.refs.button.dispatchEvent(click);
      expect(component.emit).toHaveBeenCalled();
    });
  });

  describe('Fragment', () => {
    it('should render three todos', () => {
      expect([...component.shadowRoot.querySelectorAll('to-do')].length).toBe(3);
    });

    it('should use the default Array functions to reset the list', () => {
      component.state.todos[0].completed = true;
      expect([...component.shadowRoot.querySelectorAll('li')].length).toBe(2);
    });
  });
});