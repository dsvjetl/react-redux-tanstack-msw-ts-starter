import { useDispatch, useSelector } from 'react-redux';
import { ChangeEvent, useState } from 'react';

import styles from './Todos.module.scss';
import { add, reset } from '../../../../store/todoSlice';
import { Todo } from '../Todo';

const Todos = () => {
  const [value, setValue] = useState('');
  const todo: string[] = useSelector((state: any) => state.todo);
  const dispatch = useDispatch();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const addTodo = () => {
    dispatch(add(value));
    setValue('');
  };

  const resetTodos = () => {
    dispatch(reset());
  };

  const renderTodos = () => {
    return (
      <>
        <h4>Redux todo list:</h4>
        <ul>
          {todo.list.map((todo: string, index: number) => (
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
      <button onClick={resetTodos}>Reset todos</button>
      {renderTodos()}
    </div>
  );
};

export default Todos;
