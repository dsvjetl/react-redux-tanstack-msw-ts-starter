import { type ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import styles from './AppShell.module.scss';
import { BottomNav } from '../BottomNav';
import { TaskDetailDialog } from '../TaskDetailDialog';
import { TaskDetailProvider } from '../TaskDetailDialog/TaskDetailContext';
import { useTaskDetail } from '../TaskDetailDialog/useTaskDetail';
import { TaskEditorSheet } from '../TaskEditorSheet';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { close } from '../../../store/taskEditorSlice';
import {
  exitApp,
  registerBackButton,
} from '../../services/native/appLifecycle';

interface AppShellProps {
  children: ReactNode;
}

const AppShellContent = ({ children }: AppShellProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const editorOpen = useAppSelector(
    (state) => state.taskEditor.mode !== 'closed',
  );
  const { target, closeTaskDetail } = useTaskDetail();
  const detailOpen = target !== null;

  useEffect(() => {
    return registerBackButton(() => {
      if (detailOpen) {
        closeTaskDetail();
        return;
      }
      if (editorOpen) {
        dispatch(close());
        return;
      }
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
      exitApp();
    });
  }, [closeTaskDetail, detailOpen, dispatch, editorOpen, navigate]);

  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <TaskEditorSheet />
      <TaskDetailDialog />
      <BottomNav />
    </div>
  );
};

const AppShell = ({ children }: AppShellProps) => (
  <TaskDetailProvider>
    <AppShellContent>{children}</AppShellContent>
  </TaskDetailProvider>
);

export default AppShell;
