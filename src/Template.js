import { Fragment } from './Fragment';

export class Template extends Fragment {
  constructor(strings, values, location, context) {
    super(strings, values, location, context);
  }

  _setParts(node) {
    super._setParts();
    this.location.appendChild(node);
  }
}
