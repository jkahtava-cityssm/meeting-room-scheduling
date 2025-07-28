export async function fetchGET(url: string, params: object = {}, revalidate: number = 0, tags: string[] = []) {
  const queryString = Object.entries(params)
    .map((param) => {
      return `${param[0]}=${encodeURIComponent(param[1])}`;
    })
    .join("&");

  return fetch(`${url}?${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: revalidate === 0 ? "no-store" : "force-cache", // Disable caching
    next: {
      revalidate: revalidate, // Revalidate every 60 seconds
      tags: tags,
    },
  }).then((res) => {
    if (!res.ok) throw new Error("Network Response Error");

    return res.json();
  });
}

export function fetchPUT(url: string, data: object) {
  return fetch(url, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  }).then((res) => {
    if (!res.ok) throw new Error("Network Response Error");

    return res.json();
  });
}

export function fetchDELETE(url: string) {
  return fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  }).then((res) => {
    if (!res.ok) throw new Error("Network Response Error");

    return res.json();
  });
}

export function fetchPOST(url: string, data: object) {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  }).then((res) => {
    if (!res.ok) throw new Error("Network Response Error");

    return res.json();
  });
}
