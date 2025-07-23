export function getFetch(url: string, params: object = {}) {
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
  }).then((res) => res.json());
}

export function putFetch(url: string, data: object) {
  return fetch(url, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  }).then((res) => res.json());
}
