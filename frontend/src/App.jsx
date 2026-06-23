import { useState, useEffect } from 'react'
import { fetchEvasao, fetchCurva, fetchRanking } from './api'

// ---- Tokens do design ----
const ACCENT = '#3D9BE9'
const C = {
  bg: '#0B0E13', card: '#13171E', inner: '#0E1218',
  border: '#232A33', borderField: '#2A323D',
  text: '#E8ECF2', title: '#F2F5F9', muted: '#727B8A', faint: '#5E6776',
  value: '#D4DAE2',
}
const mono = "'IBM Plex Mono', monospace"

// ---- Códigos reais do INEP ----
// CO_CINE_AREA_GERAL -> nome (igual ao NO_CINE_AREA_GERAL do arquivo)
const AREAS = [
  { id: 1, label: 'Educação' },
  { id: 2, label: 'Artes e humanidades' },
  { id: 3, label: 'Ciências sociais, comunicação e informação' },
  { id: 4, label: 'Negócios, administração e direito' },
  { id: 5, label: 'Ciências naturais, matemática e estatística' },
  { id: 6, label: 'Computação e Tecnologias da Informação e Comunicação (TIC)' },
  { id: 7, label: 'Engenharia, produção e construção' },
  { id: 8, label: 'Agricultura, silvicultura, pesca e veterinária' },
  { id: 9, label: 'Saúde e bem-estar' },
  { id: 10, label: 'Serviços' },
]
// CO_REGIAO -> nome
const REGIONS = [
  { id: 1, label: 'Norte' },
  { id: 2, label: 'Nordeste' },
  { id: 3, label: 'Sudeste' },
  { id: 4, label: 'Sul' },
  { id: 5, label: 'Centro-Oeste' },
]
// Coortes disponíveis no arquivo carregado. Se subir outros anos, adicione aqui.
const COHORTS = [2020]

// ---- Formatação pt-BR ----
const pct = (v, d = 1) =>
  Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%'
const int = (v) => Math.round(Number(v ?? 0)).toLocaleString('pt-BR')

const labelOf = (list, id) => (list.find((x) => x.id === id) || list[0]).label

// ===================================================================
//  Curva de evasão (SVG desenhado à mão, dirigido pelos dados reais)
// ===================================================================
function CurvaEvasao({ pontos }) {
  const W = 760, H = 340, padL = 54, padR = 20, padT = 20, padB = 40
  const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB
  const pw = x1 - x0, ph = y1 - y0

  if (!pontos || pontos.length === 0) {
    return <div style={{ color: C.muted, fontSize: 13, padding: '40px 0' }}>Sem dados para este recorte.</div>
  }

  const maxV = Math.max(...pontos.map((p) => p.taxaEvasao), 1)
  const yMax = Math.max(20, Math.ceil(maxV / 20) * 20)
  const n = pontos.length
  const X = (i) => x0 + (n === 1 ? pw / 2 : (i / (n - 1)) * pw)
  const Y = (v) => y1 - (v / yMax) * ph

  let line = ''
  pontos.forEach((p, i) => { line += (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ',' + Y(p.taxaEvasao).toFixed(1) + ' ' })
  const area = line + 'L' + X(n - 1).toFixed(1) + ',' + y1 + ' L' + X(0).toFixed(1) + ',' + y1 + ' Z'

  const kids = []
  for (let v = 0; v <= yMax; v += 20) {
    const yy = Y(v)
    kids.push(<line key={'hg' + v} x1={x0} y1={yy} x2={x1} y2={yy} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />)
    kids.push(<text key={'hl' + v} x={x0 - 10} y={yy + 4} textAnchor="end" style={{ fontSize: 12, fill: '#6E7785', fontFamily: mono }}>{v}%</text>)
  }
  pontos.forEach((p, i) => {
    kids.push(<line key={'vg' + i} x1={X(i)} y1={y0} x2={X(i)} y2={y1} stroke="rgba(255,255,255,0.035)" strokeWidth={1} />)
    kids.push(<text key={'vl' + i} x={X(i)} y={y1 + 23} textAnchor="middle" style={{ fontSize: 12, fill: '#6E7785', fontFamily: mono }}>{p.ano}</text>)
  })
  kids.push(<path key="area" d={area} fill="rgba(61,155,233,0.14)" />)
  kids.push(<path key="line" d={line} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />)
  pontos.forEach((p, i) => {
    const last = i === n - 1
    kids.push(
      <circle key={'pt' + i} cx={X(i)} cy={Y(p.taxaEvasao)} r={last ? 4.5 : 3}
        fill={last ? ACCENT : '#0B0E13'} stroke={last ? '#0B0E13' : ACCENT} strokeWidth={2} />
    )
  })
  const lp = pontos[n - 1]
  kids.push(
    <text key="fl" x={X(n - 1) - 9} y={Y(lp.taxaEvasao) - 11} textAnchor="end"
      style={{ fontSize: 15, fontWeight: 600, fill: ACCENT, fontFamily: mono }}>{pct(lp.taxaEvasao)}</text>
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      role="img" aria-label="Curva de evasão acumulada da coorte">{kids}</svg>
  )
}

// ===================================================================
export default function App() {
  const [area, setArea] = useState(9)      // Saúde (testado)
  const [regiao, setRegiao] = useState(3)  // Sudeste
  const [coorte, setCoorte] = useState(2020)

  const [evasao, setEvasao] = useState(null)
  const [curva, setCurva] = useState([])
  const [ranking, setRanking] = useState([])
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)

  // Recorte (área/região/coorte) -> KPI + curva
  useEffect(() => {
    let vivo = true
    setCarregando(true); setErro(null)
    Promise.all([fetchEvasao(area, regiao, coorte), fetchCurva(area, regiao, coorte)])
      .then(([ev, cv]) => { if (vivo) { setEvasao(ev); setCurva(cv) } })
      .catch((e) => { if (vivo) setErro(e.message) })
      .finally(() => { if (vivo) setCarregando(false) })
    return () => { vivo = false }
  }, [area, regiao, coorte])

  // Coorte -> ranking nacional
  useEffect(() => {
    let vivo = true
    fetchRanking(coorte).then((r) => { if (vivo) setRanking(r) }).catch(() => {})
    return () => { vivo = false }
  }, [coorte])

  const areaLabel = labelOf(AREAS, area)
  const regiaoLabel = labelOf(REGIONS, regiao)

  const rankMax = Math.max(...ranking.map((r) => r.taxaEvasao), 1)
  const rankScale = Math.max(20, Math.ceil(rankMax / 20) * 20)
  const rkTicks = []
  for (let v = 0; v <= rankScale; v += 20) rkTicks.push(v)

  const selectStyle = {
    appearance: 'none', WebkitAppearance: 'none', width: '100%',
    padding: '11px 38px 11px 13px', background: C.inner,
    border: `1px solid ${C.borderField}`, borderRadius: 9, color: C.text,
    fontSize: 14, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer', outline: 'none',
  }
  const labelCap = {
    display: 'block', fontFamily: mono, fontSize: 11, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: C.muted, marginBottom: 8,
  }
  const sectionStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px 22px 18px' }
  const eyebrow = { fontFamily: mono, fontSize: 12, color: ACCENT }
  const h2Style = { margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '0.01em', color: C.text }

  const Field = ({ cap, value, onChange, options }) => (
    <label style={{ display: 'block' }}>
      <span style={labelCap}>{cap}</span>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={onChange} style={selectStyle}>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7480', fontSize: 10 }}>▼</span>
      </div>
    </label>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Public Sans', system-ui, sans-serif", color: C.text, padding: 'clamp(16px,3vw,30px) clamp(14px,3vw,32px) 48px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>

        {/* HEADER */}
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', paddingBottom: 20, marginBottom: 22, borderBottom: `1px solid #1C232C` }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(61,155,233,0.16)', border: '1px solid rgba(61,155,233,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: ACCENT }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em', color: C.title }}>Painel de Evasão na Educação Superior</h1>
              <p style={{ margin: '5px 0 0', fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Fonte: Censo da Educação Superior — INEP · acompanhamento de coortes de ingressantes</p>
            </div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.faint, textAlign: 'right', lineHeight: 1.7, paddingTop: 3 }}>
            <div>INEP / Indicadores de Trajetória</div>
            <div>edição 2024</div>
          </div>
        </header>

        {/* BLOCK 01 — CONSULTA */}
        <section style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
            <span style={eyebrow}>01</span>
            <h2 style={h2Style}>Consulta de evasão</h2>
            <span style={{ fontSize: 12.5, color: C.faint }}>— selecione um recorte para recalcular o painel</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 22 }}>
            <Field cap="Área do curso" value={area} onChange={(e) => setArea(Number(e.target.value))} options={AREAS} />
            <Field cap="Região" value={regiao} onChange={(e) => setRegiao(Number(e.target.value))} options={REGIONS} />
            <Field cap="Coorte · ano de ingresso" value={coorte} onChange={(e) => setCoorte(Number(e.target.value))} options={COHORTS.map((c) => ({ id: c, label: String(c) }))} />
          </div>

          {/* KPI */}
          <div style={{ position: 'relative', overflow: 'hidden', background: C.inner, border: `1px solid ${C.border}`, borderRadius: 12, padding: '26px 26px 24px' }}>
            <div style={{ position: 'absolute', left: -30, top: -70, width: 340, height: 230, background: 'radial-gradient(closest-side, rgba(61,155,233,0.20), transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '26px 48px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 300px', minWidth: 240 }}>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>Taxa de evasão acumulada da coorte</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, margin: '10px 0 14px' }}>
                  <span style={{ fontFamily: mono, fontSize: 90, lineHeight: 0.86, fontWeight: 600, letterSpacing: '-0.03em', color: ACCENT }}>
                    {erro ? '—' : evasao ? Number(evasao.taxaEvasao).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '··'}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 32, fontWeight: 500, color: ACCENT, opacity: 0.75 }}>%</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, color: C.muted }}>
                  {erro ? <span style={{ color: '#E08B8B' }}>{erro} — confira se o backend está no ar.</span>
                    : `${areaLabel} · ${regiaoLabel} · ingresso ${coorte}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'stretch', flex: '0 0 auto' }}>
                <div style={{ paddingRight: 30 }}>
                  <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>Desistentes estim.</div>
                  <div style={{ fontFamily: mono, fontSize: 27, fontWeight: 600, color: C.text, marginTop: 9 }}>{evasao ? int(evasao.totalDesistentes) : '—'}</div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ paddingLeft: 30 }}>
                  <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>Ingressantes</div>
                  <div style={{ fontFamily: mono, fontSize: 27, fontWeight: 600, color: C.text, marginTop: 9 }}>{evasao ? int(evasao.totalIngressantes) : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK 02 + 03 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 18, alignItems: 'stretch' }}>

          {/* CURVA */}
          <section style={{ ...sectionStyle, flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={eyebrow}>02</span>
              <h2 style={h2Style}>Evolução da evasão da coorte {coorte}</h2>
            </div>
            <div style={{ marginTop: 5, fontSize: 12.5, color: C.muted }}>Evasão acumulada ano a ano após o ingresso — {areaLabel} · {regiaoLabel}</div>
            <div style={{ marginTop: 14, flex: '1 1 auto', display: 'flex', alignItems: 'center' }}>
              <CurvaEvasao pontos={curva} />
            </div>
          </section>

          {/* RANKING */}
          <section style={{ ...sectionStyle, flex: '1 1 400px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={eyebrow}>03</span>
              <h2 style={h2Style}>Ranking de áreas por evasão</h2>
            </div>
            <div style={{ marginTop: 5, fontSize: 12.5, color: C.muted }}>Brasil · coorte {coorte} — ordenado da maior para a menor evasão</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 8px 8px' }}>
              <div style={{ width: 168, flex: 'none' }} />
              <div style={{ flex: '1 1 auto', minWidth: 60 }} />
              <div style={{ width: 128, flex: 'none', display: 'flex', justifyContent: 'flex-end', gap: 12, fontFamily: mono, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6E7785' }}>
                <span style={{ minWidth: 44, textAlign: 'right' }}>% evasão</span>
                <span style={{ minWidth: 60, textAlign: 'right' }}>ingress.</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {ranking.map((item, i) => {
                const sel = item.area === areaLabel
                const op = ranking.length > 1 ? 0.9 - (i / (ranking.length - 1)) * 0.34 : 0.9
                const barBg = sel ? ACCENT : `rgba(61,155,233,${op.toFixed(2)})`
                return (
                  <div key={item.area} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 8px', borderRadius: 7, background: sel ? 'rgba(61,155,233,0.07)' : 'transparent' }}>
                    <div style={{ width: 168, flex: 'none', fontSize: 13, lineHeight: 1.25, color: sel ? C.title : '#AEB6C2', fontWeight: sel ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.area}>{item.area}</div>
                    <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 60, height: 22 }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', borderRadius: 5 }} />
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(item.taxaEvasao / rankScale * 100).toFixed(1)}%`, background: barBg, borderRadius: 5, transition: 'width .45s cubic-bezier(.4,0,.2,1)' }} />
                    </div>
                    <div style={{ width: 128, flex: 'none', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 12, fontFamily: mono }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: sel ? C.title : C.value, minWidth: 44, textAlign: 'right' }}>{pct(item.taxaEvasao, 0)}</span>
                      <span style={{ fontSize: 12, color: '#6E7785', minWidth: 60, textAlign: 'right' }}>{int(item.totalIngressantes)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 8px 0' }}>
              <div style={{ width: 168, flex: 'none' }} />
              <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 60, height: 16 }}>
                {rkTicks.map((v) => (
                  <span key={v} style={{ position: 'absolute', left: `${(v / rankScale * 100).toFixed(1)}%`, transform: 'translateX(-50%)', fontFamily: mono, fontSize: 11, color: '#565F6C' }}>{v}%</span>
                ))}
              </div>
              <div style={{ width: 128, flex: 'none' }} />
            </div>
          </section>
        </div>

        {carregando && <div style={{ marginTop: 16, fontFamily: mono, fontSize: 12, color: C.faint }}>atualizando recorte…</div>}
      </div>
    </div>
  )
}
