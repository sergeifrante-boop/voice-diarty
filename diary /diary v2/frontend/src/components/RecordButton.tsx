import { ChangeEvent, useRef, useState } from "react";

type Props = {
  onSubmit: (file: File) => Promise<void> | void;
  loading: boolean;
};

const RecordButton = ({ onSubmit, loading }: Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleStart = async () => {
    if (!navigator.mediaDevices) {
      setStatus("Браузер не поддерживает запись. Используйте загрузку файла.");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `entry-${Date.now()}.webm`, { type: blob.type });
      setStatus("Отправляем запись...");
      try {
        await onSubmit(file);
        setStatus("Готово");
      } catch (error) {
        setStatus("Ошибка при сохранении записи");
      }
    };
    recorder.start();
    setIsRecording(true);
    setStatus("Идет запись...");
  };

  const handleStop = () => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("Отправляем файл...");
    try {
      await onSubmit(file);
      setStatus("Готово");
    } catch (error) {
      setStatus("Ошибка при загрузке файла");
    }
    event.target.value = "";
  };

  return (
    <section>
      <h2>Записать голос</h2>
      <div className="record-actions">
        <button onClick={isRecording ? handleStop : handleStart} disabled={loading}>
          {isRecording ? "Остановить" : "Начать запись"}
        </button>
        <label>
          или загрузить файл
          <input type="file" accept="audio/*" onChange={handleFileChange} disabled={loading} />
        </label>
      </div>
      {status && <p>{status}</p>}
    </section>
  );
};

export default RecordButton;
