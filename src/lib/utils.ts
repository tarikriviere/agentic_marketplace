import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatMON(wei: bigint, decimals = 4): string {
  const eth = Number(wei) / 1e18;
  return `${eth.toFixed(decimals)} MON`;
}

export function uuidToBytes32(uuid: string): `0x${string}` {
  const hex = uuid.replace(/-/g, "").padEnd(64, "0");
  return `0x${hex}`;
}

export function skillsToArray(skills: string | string[]): string[] {
  if (Array.isArray(skills)) return skills;
  return skills.split(",").map((s) => s.trim()).filter(Boolean);
}
