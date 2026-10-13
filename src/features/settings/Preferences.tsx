import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
const schema = z.object({
  language: z.enum(['en', 'hi']),
  dark: z.boolean(),
  haptics: z.boolean(),
});
export type Preferences = z.infer<typeof schema>;
const defaults: Preferences = { language: 'en', dark: false, haptics: true };
const Context = createContext({
  ...defaults,
  ready: true,
  error: '',
  update: async (_patch: Partial<Preferences>) => {},
});
export function PreferencesProvider({ children }: React.PropsWithChildren) {
  const [value, setValue] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const current = useRef(defaults);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem('tapza.preferences.v1')
      .then(raw => {
        if (active && raw) {
          const next = schema.parse(JSON.parse(raw));
          current.current = next;
          setValue(next);
        }
      })
      .catch(() => {
        if (active)
          setError('Could not restore preferences. Try saving them again.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const update = async (patch: Partial<Preferences>) => {
    writes.current = writes.current.then(async () => {
      try {
        const next = schema.parse({ ...current.current, ...patch });
        await AsyncStorage.setItem(
          'tapza.preferences.v1',
          JSON.stringify(next),
        );
        current.current = next;
        setValue(next);
        setError('');
      } catch {
        setError('Could not save preferences. Please retry.');
      }
    });
    await writes.current;
  };
  return (
    <Context.Provider value={{ ...value, ready, error, update }}>
      {children}
    </Context.Provider>
  );
}
export const usePreferences = () => useContext(Context);
