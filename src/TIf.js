export class TIf extends HTMLElement {  
  constructor() {
    super();
    this.cached = [];
  }
    
  connectedCallback() {
    this.style.display = 'contents';  
  }
    
  set condition(condition) {
    if (condition === false) {
      Array.from(this.children).map(child => {
        this.cached.push(child);
        this.removeChild(child);
      });
      this.innerHTML = '';
    } else if (condition === true) {
      this.cached.forEach(child => this.appendChild(child));
      this.cached = [];
    }
  }
}
  
if (!customElements.get('t-if')) {
  customElements.define('t-if', TIf);
}