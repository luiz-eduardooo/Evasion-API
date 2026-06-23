// Base do backend. Em dev cai no localhost; em produção (Vercel),
// defina VITE_API_URL com a URL do Render (ex.: https://seu-app.onrender.com)
const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function getJson(path) {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(`Falha ao buscar dados (${res.status})`)
  return res.json()
}

export function fetchEvasao(area, regiao, coorte) {
  return getJson(`/evasao?area=${area}&regiao=${regiao}&coorte=${coorte}`)
}

export function fetchCurva(area, regiao, coorte) {
  return getJson(`/evasao/curva?area=${area}&regiao=${regiao}&coorte=${coorte}`)
}

export function fetchRanking(coorte) {
  return getJson(`/evasao/ranking?coorte=${coorte}`)
}
