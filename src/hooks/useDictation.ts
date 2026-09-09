import { useState, useCallback } from 'react';

export function useDictation(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta dictado por voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CL';
    recognition.interimResults = false;
    recognition.continuous = false;

    let localIsListening = true;
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    recognition.onend = () => {
      setIsListening(false);
      localIsListening = false;
    };
    recognition.onerror = () => {
      setIsListening(false);
      localIsListening = false;
    };

    recognition.start();
  }, [onResult]);

  return { isListening, startListening };
}
