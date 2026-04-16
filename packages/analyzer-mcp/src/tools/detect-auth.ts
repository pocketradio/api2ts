export type AuthInfo = {
  type: "bearer" | "api-key-header" | "api-key-query" | "oauth2" | "none";
  headerName?: string;
  queryParam?: string;
};

export async function detectAuth(headers: Record<string, string>): Promise<AuthInfo> {

  // its already an object but normalizing for casing consistency

  const normalized = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    // obj.ent -> convts into a 2d array of key value pairs. [[k:v], [k:v] .. ]
    // the map will lowercase each key for consistency & then fromentries rebuilds it as an object 

  );

  const auth = normalized["authorization"] ?? ""; // if header doesnt' exist, use empty str ""
  if (auth.toLowerCase().startsWith("bearer")) { // jwt , oauth access tokens
    return { type: "bearer" };
  }

  const wwwAuth = normalized["www-authenticate"] ?? ""; // only appears in 401s

  if (wwwAuth.toLowerCase().startsWith("bearer")){ // server demanding oauth2
    return { type: "oauth2" };
  } 


  // here the key name is enough. eg x-api-key tells generateclient where to put user's key
  // but not what the key is. 
  for (const key of Object.keys(normalized)) {
    if (key.includes("api-key") || key.includes("api_key") || key === "x-api-key") {
      return { 
        type: "api-key-header", headerName: key 
      };
    }
  }

  return { type: "none" };
}