import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export type Poll = {
  id: string;
  code: string;
  title: string;
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
};

export type Option = {
  id: string;
  poll_id: string;
  text: string;
  position: number;
  created_at: string;
};

export type Vote = {
  id: string;
  poll_id: string;
  option_id: string;
  voter_id: string;
  created_at: string;
};

export type OptionWithVotes = Option & {
  vote_count: number;
};

export type PollWithOptions = Poll & {
  options: OptionWithVotes[];
  total_votes: number;
};
