import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';

import styles from './Todos.module.scss';
import { add } from '../../../../store/todoSlice';
import { Todo } from '../Todo';

const Todos = () => {
  const [value, setValue] = useState('');
  const todo = useSelector((state) => state.todo);
  const dispatch = useDispatch();

  const handleInputChange = (event) => {
    setValue(event.target.value);
  };

  const addTodo = () => {
    dispatch(add(value));
    setValue('');
  };

  const renderTodos = () => {
    return (
      <>
        <h4>Redux todo list:</h4>
        <ul>
          {todo.list.map((todo, index) => (
            <Todo key={index} todo={todo} />
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className={styles.todos}>
      <h3>Todos</h3>
      <input type="text" value={value} onChange={handleInputChange} />
      <button onClick={addTodo}>Add todo</button>
      {renderTodos()}
    </div>
  );
};

export default Todos;
