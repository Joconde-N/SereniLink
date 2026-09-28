export const PASSWORD_HELP = "Use at least 8 characters, an uppercase letter, a number, and a special character.";

export function passwordError(password) {
  const value = password.trim();
  return value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value)
    && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) ? "" : PASSWORD_HELP;
}
