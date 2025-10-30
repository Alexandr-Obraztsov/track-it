import { VoiceRecordButton } from './VoiceRecordButton';
import { TextTaskButton } from './TextTaskButton';

export const TaskActionButtons = () => {
  return (
    <div className="fixed bottom-20 right-6 z-40 flex flex-col gap-3">
      {/* Кнопка текстового ввода */}
      <TextTaskButton />
      
      {/* Кнопка голосовой записи */}
      <VoiceRecordButton />
    </div>
  );
};
