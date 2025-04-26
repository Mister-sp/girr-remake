import React from 'react';

export default function LowerThird({
  title, subtitle,
  transitionIn = 'fade', transitionOut = 'slide',
  fontFamily = 'Roboto', fontUrl, fontSize = 32, fontWeight = 700, fontStyle = 'normal', textDecoration = 'none',
  textColor = '#fff', textStrokeColor = '#000', textStrokeWidth = 0,
  backgroundColor = '#181818', backgroundOpacity = 0.97,
  logoInLowerThird = false, logoPosition = 'left', logoUrl
}) {
  if (!title && !subtitle) return null;
  // Inject Google Font dynamiquement si besoin
  React.useEffect(() => {
    if (fontUrl) {
      let link = document.getElementById('lt-live-font');
      if (!link) {
        link = document.createElement('link');
        link.id = 'lt-live-font';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = fontUrl;
    }
  }, [fontUrl]);
  // Transitions CSS
  const transitionStyle = transitionIn === 'slide' ? {animation:'slideIn 0.5s'} : transitionIn === 'fade' ? {animation:'fadeIn 0.5s'} : {};
  // Couleur de fond avec opacité
  const bgColor = backgroundColor + (backgroundOpacity<1?Math.round(backgroundOpacity*255).toString(16).padStart(2,'0'):'');
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      zIndex: 100,
      pointerEvents: 'none',
      margin: 0,
      padding: 0,
      ...transitionStyle
    }}>
      <div style={{
        background: bgColor,
        borderRadius: 0,
        width: '100%',
        height: 'auto',
        padding: '16px 48px',
        fontFamily, fontSize, fontWeight, fontStyle, textDecoration,
        color: textColor, letterSpacing: 1.2,
        boxShadow: '0 2px 32px #000a',
        borderTop: '2px solid #fff',
        borderBottom: '2px solid #fff',
        borderLeft: 0,
        borderRight: 0,
        display: 'flex',
        alignItems: 'center',
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
        margin: 0,
        boxSizing: 'border-box',
        WebkitTextStroke: textStrokeWidth>0?`${textStrokeWidth}px ${textStrokeColor}`:undefined
      }}>
        {logoInLowerThird && logoUrl && logoPosition==='left' && (
          <img src={logoUrl} alt="logo" style={{height:48,width:48,objectFit:'contain',marginRight:16,borderRadius:8}} />
        )}
        <div>
          {title && <div>{title}</div>}
          {subtitle && <div style={{ fontSize: fontSize*0.7, fontWeight: 400, color: '#FFD166', marginTop: 4 }}>{subtitle}</div>}
        </div>
        {logoInLowerThird && logoUrl && logoPosition==='right' && (
          <img src={logoUrl} alt="logo" style={{height:48,width:48,objectFit:'contain',marginLeft:16,borderRadius:8}} />
        )}
      </div>
      {/* Styles de transition pour le lower third live */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideIn { from { transform:translateY(40px); opacity:0; } to { transform:translateY(0); opacity:1; } }
      `}</style>
    </div>
  );
}
