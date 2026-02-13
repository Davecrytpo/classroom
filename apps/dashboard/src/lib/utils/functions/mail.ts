import { env } from '$env/dynamic/public';

export const getEmailSender = (name?: string) => {
  const defaultSender = env.PUBLIC_EMAIL_SENDER || 'ClassroomIO <notify@mail.classroomio.com>';
  
  if (!name) {
    return defaultSender;
  }

  const emailMatch = defaultSender.match(/<(.+)>/);
  if (emailMatch) {
    const email = emailMatch[1];
    return `"${name}" <${email}>`;
  }

  return `"${name}" <${defaultSender}>`;
};
