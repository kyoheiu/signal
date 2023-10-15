import * as fs from "fs/promises";

const LIMIT_TIME = 60000; // 1 minute
const MAX_ATTEMPT = 5;
const RATE_LIMIT_PATH = "./data/.rate_limit";

interface FailedAttempt {
  dn: string;
  time: number;
}

export const rateLimited = async (dn: string) => {
  const failedAttempts = await readFailedAttempt();
  if (!failedAttempts) {
    return false;
  }
  const now = Date.now();
  const filtered = failedAttempts.filter(
    (attempt) => attempt.dn === dn && attempt.time > now - LIMIT_TIME,
  );
  if (filtered.length < MAX_ATTEMPT) {
    console.log(`${filtered.length} failed attempts within a minute so far.`);
    return false;
  } else {
    console.log(`Err: ${filtered.length} failed attempts within a minute.`);
    return true;
  }
};

export const writeFailedAttempt = async (dn: string) => {
  let failedAttempts = await readFailedAttempt();
  const now = Date.now();
  const attempt = { dn: dn, time: now };
  if (!failedAttempts) {
    await fs.writeFile(RATE_LIMIT_PATH, JSON.stringify([attempt]));
  } else {
    failedAttempts.push(attempt);
    await fs.writeFile(RATE_LIMIT_PATH, JSON.stringify(failedAttempts));
  }
  console.log(`Failed attempt saved: ${dn} in ${now}`);
};

const readFailedAttempt = async (): Promise<FailedAttempt[] | null> => {
  try {
    const str = await fs.readFile(RATE_LIMIT_PATH, {
      encoding: "utf8",
    });
    return JSON.parse(str);
  } catch (e) {
    console.log("No failed attempts.");
    return null;
  }
};
