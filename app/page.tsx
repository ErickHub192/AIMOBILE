'use client'
import Link from 'next/link'

export default function Landing() {
  return (
    <div className="hero-bg ppage" style={{ display:'flex', flexDirection:'column', padding:'40px 24px 32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36,height:36,borderRadius:10,background:'var(--p)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#fff' }}>S</div>
        <span style={{ fontWeight:600,fontSize:15 }}>snitch</span>
      </div>

      <div style={{ flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'64px 0 48px' }}>
        <h1 style={{ fontSize:40,fontWeight:700,lineHeight:1.15,marginBottom:16 }}>
          Construye tu App<br />con <span className="g-text">magia IA</span>
        </h1>
        <p style={{ color:'var(--t2)',fontSize:16,lineHeight:1.65,marginBottom:32 }}>
          El arquitecto autónomo que diseña, codifica y lanza tu visión en segundos.
        </p>
        <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:44 }}>
          <span className="tag">UI Adaptativa</span>
          <span className="tag">Código Instantáneo</span>
          <span className="tag">Sin Fricción</span>
        </div>
        <Link href="/signup" className="btn btn-p" style={{ width:'100%',fontSize:15,padding:'16px 0' }}>
          Comenzar
        </Link>
        <p style={{ textAlign:'center',marginTop:20,color:'var(--t3)',fontSize:11,letterSpacing:0.5 }}>
          ¿YA TIENES CUENTA?{' '}
          <Link href="/login" style={{ color:'var(--pl)' }}>INICIAR SESIÓN</Link>
        </p>
      </div>
    </div>
  )
}
