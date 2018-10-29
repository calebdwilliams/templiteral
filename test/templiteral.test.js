/* global templit describe beforeEach afterEach it expect spyOn */
let myEl;
let elClass;

// This necessarily takes time,
// no need to factor that in to tests
window.requestAnimationFrame = callback => callback();

describe('templiteral', () => {
  beforeEach(() => {
    class MyEl extends HTMLElement {
      constructor() {
        super();
        this.html = templit.templiteral(this, this);
        this.helloWho = 'world';
        this.isDisabled = false;
      }
      
      onInit() {
        this.init = true;
      }
      
      connectedCallback() {
        this.render();
      }
      
      changeHelloWho() {
        this.helloWho = 'Caleb';
        this.render();
      }
      
      render() {
        this._ = this.html`
          <h1>Hello ${this.helloWho}</h1>
          <p class="${this.helloWho}">This is a paragraph</p>
          <button ref="button" (click)="${this.changeHelloWho}" [disabled]="${this.isDisabled}">Change hello who</button>
        `;
      }
    }
    elClass = MyEl;
    spyOn(elClass.prototype, 'onInit');
    if (!customElements.get('my-el')) {
      customElements.define('my-el', MyEl);
    }
  });

  beforeEach(() => {
    const el = myEl = document.createElement('my-el');
    el.setAttribute('who', 'Caleb');
    document.body.appendChild(el);
    myEl = document.querySelector('my-el');
  });

  afterEach(function() {
    myEl.who = 'world';
    myEl.render();
  });

  /** Tests */
  it('should create a custom element instance', () => expect(myEl).toBeDefined());
  it('should render content', () => expect(myEl.querySelector('h1')).toBeDefined());

  /** ContentNode */
  describe('ContentNode', () => {
    it('should interpolate content based on the element\'s data', () => 
      expect(myEl.querySelector('h1').textContent).toBe(`Hello ${myEl.helloWho}`)
    );

    it('should update interpolations on repeat calls to the templiteral function', () => {
      expect(myEl.querySelector('h1').textContent).toBe(`Hello ${myEl.helloWho}`);
      myEl.helloWho = 'Caleb';
      myEl.render();
      expect(myEl.querySelector('h1').textContent).toBe(`Hello ${myEl.helloWho}`);
    });
  });
  

  /** AttributeNode */
  describe('AttributeNode', () => {
    let reference; 
    let button; 
    beforeEach(() => {
      reference = myEl.querySelector('p').classList[0];
      button = myEl.querySelector('button');
    });

    it('should interpolate attributes based on the element\'s data', () => expect(myEl.querySelector('p').classList[0]).toBe(myEl.helloWho));
    it('should update interpolations on repeat calls to the templiteral function', () => {
      expect(reference).toBe(myEl.helloWho);
      myEl.helloWho = 'Caleb';
      myEl.render();
      expect(reference).toBe(myEl.helloWho);
    });
    it('should add event listeners', () => {
      button.dispatchEvent(new Event('click'));
      expect(myEl.helloWho).toBe('Caleb');
    });
    it('should toggle properties', () => {
      expect(button.disabled).toBe(false);
      myEl.isDisabled = true;
      myEl.render();
      expect(button.disabled).toBe(true);
    });
    it('should define refs', () => {
      expect(myEl.refs.button).toBeDefined();
    });
    it('should call functions', () => {

    });
  });
});
