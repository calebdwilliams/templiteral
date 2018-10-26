import { Component } from '../../templiteral.js';

Component.defineStyles('todo-mvc', `todo-mvc {
  background: #fff;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 25px 50px 0 rgba(0, 0, 0, 0.1);
  display: block;
  position: relative;
}`);

Component.defineStyles('todo-item', `
:host {
    background: #fff;
    border-bottom: 1px solid #ededed;
    font-size: 1.5rem;
    display: block;
    position: relative;
  }
  .hidden {
    display: none;
  }
  form {
    display: flex;
  }
  .completed {
    height: 40px;
  }
  input[type="checkbox"] {
    position: absolute;
      left: -9999px;
  }
  input[type="checkbox"] + .checkbox:before {
    border: 1px solid #ededed;
    border-radius: 50%;
    content: "";
    cursor: pointer;
    display: block;
    margin: 10px;
    height: 30px;
    transition: background border-color 0.2s ease-in-out;
    width: 30px;
  }
  input[type="checkbox"]:checked + .checkbox:before {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-10 -18 100 135"><path fill="#5dc2af" d="M72 25L42 71 27 56l-4 4 20 20 34-52z"/></svg>');
    border-color: #bddad5;
    background-position: -8px center;
    background-repeat: no-repeat;
  }
  input[type="checkbox"]:focus + .checkbox:before {
    border: 2px solid #5dc2af;
  }
  input[type="checkbox"]:active + .checkbox:before {
    background: #ededed;
    border: 2px solid #5dc2af;
  }
  .sr-only {
    position: absolute;
      left: -9999px;
  }
  .edit-todo, .todo-title {
      background: transparent;
      border: 0;
      color: #cc9a9a;
      flex: 1 1 auto;
      font-size: 1.5rem;
      font-weight: 300;
      text-align: left;
      transition: all 0.2s ease-in-out;
  }
  .todo-completed { 
    color: #d9d9d9;
    text-decoration: line-through;
  }
  .delete-todo {
    background: transparent;
    border: 0;
    color: #cc9a9a;
    cursor: pointer;
    font-size: 1.5rem;
    opacity: 0;
    padding: 0 1rem 0 0;
  }
  form:hover .delete-todo {
    opacity: 1;
  }
`);

Component.defineStyles('create-todo', `
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
}`);