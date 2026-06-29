import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';
import { env } from '../env';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const mockData = new Proxy([], {
  get(target, prop) {
    if (prop === 'session' || prop === 'subscription') return null;
    return Reflect.get(target, prop);
  }
});

const mockSupabase: any = new Proxy(() => {}, {
  get(target, prop, receiver) {
    if (prop === 'then') {
      return (resolve: any, reject: any) => {
        return Promise.resolve({ data: mockData, error: null }).then(resolve, reject);
      };
    }
    return mockSupabase;
  },
  apply(target, thisArg, argumentsList) {
    return mockSupabase;
  }
});

export const supabase = (supabaseUrl && isValidUrl(supabaseUrl) && supabaseAnonKey)
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : mockSupabase;
