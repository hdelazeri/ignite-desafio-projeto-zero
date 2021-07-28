import styles from './exitPreviewButton.module.scss';

export const ExitPreviewButton: React.FC = () => {
  return (
    <a href="/api/exit-preview" className={styles.exitButton}>
      Sair do modo preview
    </a>
  );
};
