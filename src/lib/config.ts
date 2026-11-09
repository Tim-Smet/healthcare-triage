/**
 * The number the emergency buttons dial. Empty by default, so a prototype can
 * never dial anyone. Set it per deployment to turn the buttons into tel: links.
 */
export const EMERGENCY_NUMBER = process.env.NEXT_PUBLIC_EMERGENCY_NUMBER?.trim() || undefined;
