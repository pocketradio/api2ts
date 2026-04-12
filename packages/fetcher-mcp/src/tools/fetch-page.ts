export async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "api2ts/0.1.0" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

// redirect : follow ensures that if the server says , say , "xyz page moved to new URL",
// that is, a 301/301 redir, then it follows it automatically w/o stopping. 