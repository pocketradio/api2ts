export type TestResult = {
  method: string;
  url: string;
  status: number;
  responseTime: number;
  body: string;
  error?: string;
};

export async function testEndpoint(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown
): Promise<TestResult> {


  const start = Date.now()
  
  const response = await fetch(url,{
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const end = Date.now()
  
  const responseTime = end-start


  return { method, url, status: response.status , responseTime, body : await response.text()};
}
