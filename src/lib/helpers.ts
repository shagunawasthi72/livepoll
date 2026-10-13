const voterIdKey = "livepoll_voter_id";

export function getVoterId(): string {
  let id = localStorage.getItem(voterIdKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(voterIdKey, id);
  }
  return id;
}

export function generatePollCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
