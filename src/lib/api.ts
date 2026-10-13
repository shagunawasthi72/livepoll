import { supabase, type Poll, type Option, type Vote } from "./supabase";
import { generatePollCode, getVoterId } from "./helpers";

export type PollWithOptionsAndVotes = Poll & {
  options: (Option & { vote_count: number })[];
  total_votes: number;
};

export async function createPoll(
  title: string,
  optionTexts: string[]
): Promise<{ poll: Poll; options: Option[] } | { error: string }> {
  const cleanTitle = title.trim();
  const cleanOptions = optionTexts.map((o) => o.trim()).filter(Boolean);

  if (!cleanTitle) return { error: "Please enter a question." };
  if (cleanOptions.length < 2)
    return { error: "Please provide at least two answer choices." };

  const code = generatePollCode();

  const { data: pollData, error: pollError } = await supabase
    .from("polls")
    .insert({ code, title: cleanTitle, status: "active" })
    .select()
    .single();

  if (pollError || !pollData) {
    return { error: "Could not create the poll. Please try again." };
  }

  const poll = pollData as Poll;

  const optionRows = cleanOptions.map((text, index) => ({
    poll_id: poll.id,
    text,
    position: index,
  }));

  const { data: optionData, error: optionError } = await supabase
    .from("options")
    .insert(optionRows)
    .select();

  if (optionError || !optionData) {
    await supabase.from("polls").delete().eq("id", poll.id);
    return { error: "Could not create answer choices. Please try again." };
  }

  return { poll, options: optionData as Option[] };
}

export async function getPollByCode(
  code: string
): Promise<PollWithOptionsAndVotes | null> {
  const upperCode = code.trim().toUpperCase();

  const { data: poll, error } = await supabase
    .from("polls")
    .select("*")
    .eq("code", upperCode)
    .maybeSingle();

  if (error || !poll) return null;

  return await getPollWithOptions(poll as Poll);
}

export async function getPollWithOptions(
  poll: Poll
): Promise<PollWithOptionsAndVotes> {
  const { data: options } = await supabase
    .from("options")
    .select("*")
    .eq("poll_id", poll.id)
    .order("position", { ascending: true });

  const { data: votes } = await supabase
    .from("votes")
    .select("option_id")
    .eq("poll_id", poll.id);

  const voteCounts = new Map<string, number>();
  let totalVotes = 0;
  for (const v of votes || []) {
    const optId = (v as Vote).option_id;
    voteCounts.set(optId, (voteCounts.get(optId) || 0) + 1);
    totalVotes++;
  }

  const optionsWithVotes = (options || []).map((opt) => ({
    ...(opt as Option),
    vote_count: voteCounts.get((opt as Option).id) || 0,
  }));

  return {
    ...poll,
    options: optionsWithVotes,
    total_votes: totalVotes,
  };
}

export async function castVote(
  pollId: string,
  optionId: string
): Promise<{ error?: string }> {
  const voterId = getVoterId();

  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("voter_id", voterId)
    .maybeSingle();

  if (existing) {
    return { error: "You have already voted in this poll." };
  }

  const { error } = await supabase.from("votes").insert({
    poll_id: pollId,
    option_id: optionId,
    voter_id: voterId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You have already voted in this poll." };
    }
    return { error: "Could not submit your vote. Please try again." };
  }

  return {};
}

export async function hasVoted(pollId: string): Promise<boolean> {
  const voterId = getVoterId();
  const { data } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("voter_id", voterId)
    .maybeSingle();
  return !!data;
}

export async function getVotedOptionId(
  pollId: string
): Promise<string | null> {
  const voterId = getVoterId();
  const { data } = await supabase
    .from("votes")
    .select("option_id")
    .eq("poll_id", pollId)
    .eq("voter_id", voterId)
    .maybeSingle();
  return data ? (data as Vote).option_id : null;
}

export async function closePoll(pollId: string): Promise<void> {
  await supabase
    .from("polls")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", pollId);
}

export async function reopenPoll(pollId: string): Promise<void> {
  await supabase
    .from("polls")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", pollId);
}
