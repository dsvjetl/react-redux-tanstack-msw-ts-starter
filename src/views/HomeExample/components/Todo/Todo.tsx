import styles from './Todo.module.scss';

interface TodoProps {
  todo: string;
}

const Todo = ({ todo }: TodoProps) => {
  return <li className={styles.todo}>{todo}</li>;
};

export default Todo;
