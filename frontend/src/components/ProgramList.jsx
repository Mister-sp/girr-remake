import React, { useState, useEffect } from 'react';
import { getPrograms, createProgram, deleteProgram, updateProgram } from '../services/api'; // Importer createProgram, deleteProgram et updateProgram
import defaultLogo from '../assets/default-logo.png';
import styles from './ProgramList.module.css';
import Modal from './Modal.jsx';
import './logo-effects.css';

// Aperçu live du lower third
function LowerThirdPreview({
  title, subtitle,
  transitionIn, transitionOut,
  fontFamily, fontUrl, fontSize, fontWeight, fontStyle, textDecoration,
  textColor, textStrokeColor, textStrokeWidth,
  backgroundColor, backgroundOpacity,
  logoInLowerThird, logoPosition, logoUrl
}) {
  // Inject Google Font dynamiquement si besoin
  React.useEffect(() => {
    if (fontUrl && fontUrl.startsWith('data:')) {
      // Police locale (dataURL) : injecter un @font-face dynamique
      let style = document.getElementById('lt-preview-font-local');
      if (!style) {
        style = document.createElement('style');
        style.id = 'lt-preview-font-local';
        document.head.appendChild(style);
      }


      style.textContent = `@font-face { font-family: '${fontFamily}'; src: url('${fontUrl}'); }`;
    } else if (fontUrl) {
      // Google Fonts classique
      let link = document.getElementById('lt-preview-font');
      if (!link) {
        link = document.createElement('link');
        link.id = 'lt-preview-font';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }


      link.href = fontUrl;
    }


    // Pas de clean-up pour l'aperçu
  }, [fontUrl, fontFamily]);
  // Transitions CSS simples
  const transitionStyle = transitionIn === 'slide' ? {animation:'slideIn 0.5s'} : transitionIn === 'fade' ? {animation:'fadeIn 0.5s'} : {};
  return (
    <div style={{position:'relative',height:90,background:'transparent',overflow:'visible'}}>
      <div style={{
        position:'absolute',left:0,right:0,bottom:0,width:'100%',pointerEvents:'none',...transitionStyle
      }}>
        <div style={{
          background: backgroundColor + (backgroundOpacity<1?Math.round(backgroundOpacity*255).toString(16).padStart(2,'0'):'') ,
          borderRadius:0,width:'100%',height:'auto',padding:'12px 32px',
          fontFamily: fontFamily, fontSize, fontWeight, fontStyle, textDecoration,
          color: textColor, letterSpacing:1.2, boxShadow:'0 2px 32px #000a',
          borderTop:'2px solid #fff',borderBottom:'2px solid #fff',display:'flex',alignItems:'center',
          textAlign:'left',whiteSpace:'pre-wrap',margin:0,boxSizing:'border-box',
          WebkitTextStroke: textStrokeWidth>0?`${textStrokeWidth}px ${textStrokeColor}`:undefined
        }}>
          {logoInLowerThird && logoUrl && logoPosition==='left' && (
            <img src={logoUrl} alt="logo" style={{height:48,width:48,objectFit:'contain',marginRight:16,borderRadius:8}} />
          )}


          <div>
            <div>{title}</div>
            {subtitle && <div style={{ fontSize: fontSize*0.7, fontWeight: 400, color: '#FFD166', marginTop: 4 }}>{subtitle}</div>}


          </div>
          {logoInLowerThird && logoUrl && logoPosition==='right' && (
            <img src={logoUrl} alt="logo" style={{height:48,width:48,objectFit:'contain',marginLeft:16,borderRadius:8}} />
          )}


        </div>
      </div>
      {/* Styles de transition pour l'aperçu */}


      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }


        @keyframes slideIn { from { transform:translateY(40px); opacity:0; } to { transform:translateY(0); opacity:1; } }


      `}</style>
    </div>
  );
}



// Accepter onSelectProgram en props
function ProgramList({ onSelectProgram }) {
  const [showModal, setShowModal] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProgramTitle, setNewProgramTitle] = useState(''); // État pour le titre du nouveau programme
  const [newLogoFile, setNewLogoFile] = useState(null); // État pour le logo du nouveau programme
  const [newLogoPosition, setNewLogoPosition] = useState('top-right');
  const [newLogoSize, setNewLogoSize] = useState(80);
  const [newLogoEffect, setNewLogoEffect] = useState('none');
  const [newLogoEffectIntensity, setNewLogoEffectIntensity] = useState(5);

  // Lower Third Config states
  const [ltTransitionIn, setLtTransitionIn] = useState('fade');
  const [ltTransitionOut, setLtTransitionOut] = useState('slide');
  const [ltFontFamily, setLtFontFamily] = useState('Roboto');
  const [ltFontUrl, setLtFontUrl] = useState('https://fonts.googleapis.com/css?family=Roboto');
  const [ltFontSize, setLtFontSize] = useState(32);
  const [ltFontWeight, setLtFontWeight] = useState('bold');
  const [ltFontStyle, setLtFontStyle] = useState('normal');
  const [ltTextDecoration, setLtTextDecoration] = useState('none');
  const [ltTextColor, setLtTextColor] = useState('#FFFFFF');
  const [ltTextStrokeColor, setLtTextStrokeColor] = useState('#000000');
  const [ltTextStrokeWidth, setLtTextStrokeWidth] = useState(2);
  const [ltBackgroundColor, setLtBackgroundColor] = useState('#181818');
  const [ltBackgroundOpacity, setLtBackgroundOpacity] = useState(0.97);
  const [ltLogoInLowerThird, setLtLogoInLowerThird] = useState(false);
  const [ltLogoPosition, setLtLogoPosition] = useState('left');

  // Fonction pour charger les programmes
  const loadPrograms = async () => {
    try {
      setLoading(true);
      const response = await getPrograms();
      setPrograms(response.data);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération des programmes:", err);
      setError('Impossible de charger les programmes.');
    } finally {
      setLoading(false);
    }


  };

  useEffect(() => {
    loadPrograms();
  }, []);

  // Gestionnaire pour la création d'un nouveau programme
  const handleAddProgram = async (e) => {
    e.preventDefault(); // Empêcher le rechargement de la page par le formulaire
    if (!newProgramTitle.trim()) {
      // Optionnel: Ajouter une validation ou un message si le titre est vide
      alert("Le titre du programme ne peut pas être vide.");
      return;
    }


    try {
      const formData = new FormData();
      formData.append('title', newProgramTitle);
      if (newLogoFile) formData.append('logo', newLogoFile);
      formData.append('logoPosition', newLogoPosition);
      formData.append('logoSize', newLogoSize);
      formData.append('logoEffect', newLogoEffect);
      formData.append('logoEffectIntensity', newLogoEffectIntensity);
      // Ajout de la config lower third
      const lowerThirdConfig = {
        transitionIn: ltTransitionIn,
        transitionOut: ltTransitionOut,
        fontFamily: ltFontFamily,
        fontUrl: ltFontUrl,
        fontSize: ltFontSize,
        fontWeight: ltFontWeight,
        fontStyle: ltFontStyle,
        textDecoration: ltTextDecoration,
        textColor: ltTextColor,
        textStrokeColor: ltTextStrokeColor,
        textStrokeWidth: ltTextStrokeWidth,
        backgroundColor: ltBackgroundColor,
        backgroundOpacity: ltBackgroundOpacity,
        logoInLowerThird: ltLogoInLowerThird,
        logoPosition: ltLogoPosition
      };
      formData.append('lowerThirdConfig', JSON.stringify(lowerThirdConfig));
      await createProgram(formData); // Appeler l'API pour créer
      setNewProgramTitle(''); // Vider le champ de saisie
      setNewLogoFile(null);
      setNewLogoPosition('top-right');
      setNewLogoSize(80);
      setNewLogoEffect('none');
      setNewLogoEffectIntensity(5);
      await loadPrograms(); // Recharger la liste des programmes pour voir le nouveau
    } catch (err) {
      console.error("Erreur lors de la création du programme:", err);
      // Afficher une erreur plus spécifique à l'utilisateur ?
      setError('Impossible de créer le programme.');
    }


  };

  // Gestionnaire pour la suppression d'un programme
  const handleDeleteProgram = async (programId) => {
    // Confirmation avant suppression
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le programme ID ${programId} et tous ses épisodes/sujets/médias associés ?`)) {
      try {
        await deleteProgram(programId); // Appeler l'API de suppression
        await loadPrograms(); // Recharger la liste après suppression
      } catch (err) {
        console.error("Erreur lors de la suppression du programme:", err);
        setError('Impossible de supprimer le programme.');
      }


    }


  };

  if (loading) {
    return <div>Chargement des programmes...</div>;
  }



  if (error) {
    // Afficher l'erreur mais aussi le reste de l'UI pour permettre de réessayer
    return (
      <div>
        <div style={{ color: 'red' }}>Erreur : {error}</div>
        {/* Afficher quand même le formulaire et la liste existante si disponible */}


        <ProgramForm
          onSubmit={handleAddProgram}


          title={newProgramTitle}


          setTitle={setNewProgramTitle}


          logoFile={newLogoFile}


          setLogoFile={setNewLogoFile}


          logoPosition={newLogoPosition}


          setLogoPosition={setNewLogoPosition}


          logoSize={newLogoSize}


          setLogoSize={setNewLogoSize}


          logoEffect={newLogoEffect}


          setLogoEffect={setNewLogoEffect}


          logoEffectIntensity={newLogoEffectIntensity}


          setLogoEffectIntensity={setNewLogoEffectIntensity}


          ltTransitionIn={ltTransitionIn}


          setLtTransitionIn={setLtTransitionIn}


          ltTransitionOut={ltTransitionOut}


          setLtTransitionOut={setLtTransitionOut}


          ltFontFamily={ltFontFamily}


          setLtFontFamily={setLtFontFamily}


          ltFontUrl={ltFontUrl}


          setLtFontUrl={setLtFontUrl}


          ltFontSize={ltFontSize}


          setLtFontSize={setLtFontSize}


          ltFontWeight={ltFontWeight}


          setLtFontWeight={setLtFontWeight}


          ltFontStyle={ltFontStyle}


          setLtFontStyle={setLtFontStyle}


          ltTextDecoration={ltTextDecoration}


          setLtTextDecoration={setLtTextDecoration}


          ltTextColor={ltTextColor}


          setLtTextColor={setLtTextColor}


          ltTextStrokeColor={ltTextStrokeColor}


          setLtTextStrokeColor={setLtTextStrokeColor}


          ltTextStrokeWidth={ltTextStrokeWidth}


          setLtTextStrokeWidth={setLtTextStrokeWidth}


          ltBackgroundColor={ltBackgroundColor}


          setLtBackgroundColor={setLtBackgroundColor}


          ltBackgroundOpacity={ltBackgroundOpacity}


          setLtBackgroundOpacity={setLtBackgroundOpacity}


          ltLogoInLowerThird={ltLogoInLowerThird}


          setLtLogoInLowerThird={setLtLogoInLowerThird}


          ltLogoPosition={ltLogoPosition}


          setLtLogoPosition={setLtLogoPosition}


        />
        <ProgramDisplay programs={programs} onDelete={handleDeleteProgram} onSelect={onSelectProgram} />
      </div>
    );
  }



  return (
    <div>
      {/* Modal d'ajout */}


      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <ProgramForm
  onSubmit={handleAddProgram}


  title={newProgramTitle}


  setTitle={setNewProgramTitle}


  logoFile={newLogoFile}


  setLogoFile={setNewLogoFile}


  logoPosition={newLogoPosition}


  setLogoPosition={setNewLogoPosition}


  logoSize={newLogoSize}


  setLogoSize={setNewLogoSize}


  logoEffect={newLogoEffect}


  setLogoEffect={setNewLogoEffect}


  logoEffectIntensity={newLogoEffectIntensity}


  setLogoEffectIntensity={setNewLogoEffectIntensity}


  ltTransitionIn={ltTransitionIn}


  setLtTransitionIn={setLtTransitionIn}


  ltTransitionOut={ltTransitionOut}


  setLtTransitionOut={setLtTransitionOut}


  ltFontFamily={ltFontFamily}


  setLtFontFamily={setLtFontFamily}


  ltFontUrl={ltFontUrl}


  setLtFontUrl={setLtFontUrl}


  ltFontSize={ltFontSize}


  setLtFontSize={setLtFontSize}


  ltFontWeight={ltFontWeight}

          /*
          Je ne connaîtrai pas la peur, car la peur tue l’esprit.
          La peur est la petite mort qui conduit à l’oblitération totale.
          J’affronterai ma peur. Je lui permettrai de passer sur moi, au travers de moi.
          Et lorsqu’elle sera passée, je tournerai mon œil intérieur sur son chemin.
          Et là où elle sera passée, il n’y aura plus rien. Rien que moi.
          */

          setLtFontWeight={setLtFontWeight}


          ltFontStyle={ltFontStyle}


  setLtFontStyle={setLtFontStyle}


  ltTextDecoration={ltTextDecoration}


  setLtTextDecoration={setLtTextDecoration}


  ltTextColor={ltTextColor}


  setLtTextColor={setLtTextColor}


  ltTextStrokeColor={ltTextStrokeColor}


  setLtTextStrokeColor={setLtTextStrokeColor}


  ltTextStrokeWidth={ltTextStrokeWidth}


  setLtTextStrokeWidth={setLtTextStrokeWidth}


  ltBackgroundColor={ltBackgroundColor}


  setLtBackgroundColor={setLtBackgroundColor}


  ltBackgroundOpacity={ltBackgroundOpacity}


  setLtBackgroundOpacity={setLtBackgroundOpacity}


  ltLogoInLowerThird={ltLogoInLowerThird}


  setLtLogoInLowerThird={setLtLogoInLowerThird}


  ltLogoPosition={ltLogoPosition}


  setLtLogoPosition={setLtLogoPosition}



/>
      </Modal>
      {/* Passer onSelectProgram à ProgramDisplay */}


      <ProgramDisplay programs={programs} onDelete={handleDeleteProgram} onSelect={onSelectProgram} />
    </div>
  );
}



// Sous-composant pour le formulaire d'ajout
function ProgramForm({
  onSubmit, title, setTitle, logoFile, setLogoFile, logoPosition, setLogoPosition, logoSize, setLogoSize, logoEffect, setLogoEffect, logoEffectIntensity, setLogoEffectIntensity,
  ltTransitionIn, setLtTransitionIn, ltTransitionOut, setLtTransitionOut,
  ltFontFamily, setLtFontFamily, ltFontUrl, setLtFontUrl, ltFontSize, setLtFontSize,
  ltFontWeight, setLtFontWeight, ltFontStyle, setLtFontStyle, ltTextDecoration, setLtTextDecoration,
  ltTextColor, setLtTextColor, ltTextStrokeColor, setLtTextStrokeColor, ltTextStrokeWidth, setLtTextStrokeWidth,
  ltBackgroundColor, setLtBackgroundColor, ltBackgroundOpacity, setLtBackgroundOpacity,
  ltLogoInLowerThird, setLtLogoInLowerThird, ltLogoPosition, setLtLogoPosition
}) {
  return (
    <form onSubmit={onSubmit} style={{marginBottom:'20px', maxWidth:380}} encType="multipart/form-data">
      <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:340,overflowY:'auto',paddingRight:6}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Titre du programme</label>
          <input
            type="text"
            placeholder="Titre du programme"
            value={title}


            onChange={e => setTitle(e.target.value)}


            required
            style={{fontSize: 18, borderRadius: 6, border: '1px solid #bbb', padding: 6, width:'100%'}}


          />
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setLogoFile(e.target.files[0])}


          />
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Position du logo</label>
          <select value={logoPosition} onChange={e=>setLogoPosition(e.target.value)} style={{fontSize:16,padding:'4px 8px',width:'100%'}}>
            <option value="top-left">Haut gauche</option>
            <option value="top-center">Haut centre</option>
            <option value="top-right">Haut droite</option>
            <option value="bottom-left">Bas gauche</option>
            <option value="bottom-center">Bas centre</option>
            <option value="bottom-right">Bas droite</option>
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Taille du logo (px)</label>
          <input type="number" placeholder="Taille (px)" style={{width:100,fontSize:16,padding:'4px 8px'}} value={logoSize} onChange={e=>setLogoSize(Number(e.target.value))} />
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3}}>
          <label style={{fontWeight:600,marginBottom:2,color:'#222'}}>Effet</label>
          <select value={logoEffect || 'none'} onChange={e=>setLogoEffect(e.target.value)} style={{fontSize:16,padding:'4px 8px',width:'100%'}}>
            <option value="none">Aucun</option>
            <option value="float">Flottant</option>
            <option value="glitch">Glitch</option>
            <option value="pulse">Pulse</option>
            <option value="oldtv">Old TV</option>
            <option value="vhs">VHS</option>
          </select>
        </div>
        {/* Lower Third Config Section */}


        <div style={{borderTop:'1px solid #eee', margin:'16px 0 8px 0', paddingTop:8, fontWeight:600, color:'#333'}}>Personnalisation du Lower Third</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <div style={{flex:'1 1 120px'}}>
            <label>Transition entrée</label>
            <select value={ltTransitionIn} onChange={e=>setLtTransitionIn(e.target.value)} style={{width:'100%'}}>
              <option value="fade">Fondu</option>
              <option value="slide">Glissement</option>
              <option value="none">Aucune</option>
            </select>
          </div>
          <div style={{flex:'1 1 120px'}}>
            <label>Transition sortie</label>
            <select value={ltTransitionOut} onChange={e=>setLtTransitionOut(e.target.value)} style={{width:'100%'}}>
              <option value="slide">Glissement</option>
              <option value="fade">Fondu</option>
              <option value="none">Aucune</option>
            </select>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <div style={{flex:'1 1 120px'}}>
            <label>Police (Google Fonts ou locale)</label>
            <input
              type="text"
              value={ltFontFamily}


              onChange={e => {
                const val = e.target.value;
                setLtFontFamily(val);
                // Suggestion d'URL Google Fonts auto
                const known = {
                  'Roboto': 'https://fonts.googleapis.com/css?family=Roboto',
                  'Montserrat': 'https://fonts.googleapis.com/css?family=Montserrat',
                  'Press Start 2P': 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
                  'Open Sans': 'https://fonts.googleapis.com/css?family=Open+Sans',
                  'Lato': 'https://fonts.googleapis.com/css?family=Lato',
                  'Oswald': 'https://fonts.googleapis.com/css?family=Oswald',
                  'Raleway': 'https://fonts.googleapis.com/css?family=Raleway',
                  'Bebas Neue': 'https://fonts.googleapis.com/css?family=Bebas+Neue',
                  'Orbitron': 'https://fonts.googleapis.com/css?family=Orbitron',
                  'Bangers': 'https://fonts.googleapis.com/css?family=Bangers',
                  'Russo One': 'https://fonts.googleapis.com/css?family=Russo+One',
                  'Permanent Marker': 'https://fonts.googleapis.com/css?family=Permanent+Marker',
                  'Pacifico': 'https://fonts.googleapis.com/css?family=Pacifico',
                  'VT323': 'https://fonts.googleapis.com/css?family=VT323',
                  'Source Code Pro': 'https://fonts.googleapis.com/css?family=Source+Code+Pro',
                  'Fira Mono': 'https://fonts.googleapis.com/css?family=Fira+Mono',
                  'Caveat': 'https://fonts.googleapis.com/css?family=Caveat',
                };
                if (known[val]) setLtFontUrl(known[val]);
                else if (val && !ltFontUrl) {
                  // Génération auto basique si Google Fonts
                  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(val.replace(/ /g,'+'))}&display=swap`;
                  setLtFontUrl(url);
                }


              }}


              style={{width:'100%'}}


              placeholder="Roboto, Press Start 2P..."
              list="font-suggestions"
            />
            <datalist id="font-suggestions">
              <option value="Roboto" />
              <option value="Montserrat" />
              <option value="Press Start 2P" />
              <option value="Open Sans" />
              <option value="Lato" />
              <option value="Oswald" />
              <option value="Raleway" />
              <option value="Bebas Neue" />
              <option value="Orbitron" />
              <option value="Bangers" />
              <option value="Russo One" />
              <option value="Permanent Marker" />
              <option value="Pacifico" />
              <option value="VT323" />
              <option value="Source Code Pro" />
              <option value="Fira Mono" />
              <option value="Caveat" />
            </datalist>
          </div>
          <div style={{flex:'1 1 120px'}}>
            <label>URL de la police (Google Fonts ou locale)</label>
            <input type="text" value={ltFontUrl} onChange={e=>setLtFontUrl(e.target.value)} style={{width:'100%'}} placeholder="https://fonts.googleapis.com/... ou data:font/ttf;base64,..." />
            <div style={{marginTop:6}}>
              <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={async e => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setLtFontUrl(ev.target.result);
                    // Pour font-family, on peut suggérer le nom du fichier sans extension
                    if (!ltFontFamily) {
                      setLtFontFamily(file.name.replace(/\.[^.]+$/, ''));
                    }


                  };
                  reader.readAsDataURL(file);
                }


              }} />
              <span style={{fontSize:12,marginLeft:8}}>Importer une police locale (.ttf/.otf)</span>
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <div style={{flex:'1 1 70px'}}>
            <label>Taille</label>
            <input type="number" value={ltFontSize} min={10} max={96} onChange={e=>setLtFontSize(Number(e.target.value))} style={{width:'100%'}} />
          </div>
          <div style={{flex:'1 1 70px'}}>
            <label>Épaisseur</label>
            <select value={ltFontWeight} onChange={e=>setLtFontWeight(e.target.value)} style={{width:'100%'}}>
              <option value="normal">Normal</option>
              <option value="bold">Gras</option>
              <option value="lighter">Fin</option>
            </select>
          </div>
          <div style={{flex:'1 1 70px'}}>
            <label>Style</label>
            <select value={ltFontStyle} onChange={e=>setLtFontStyle(e.target.value)} style={{width:'100%'}}>
              <option value="normal">Normal</option>
              <option value="italic">Italique</option>
              <option value="oblique">Oblique</option>
            </select>
          </div>
          <div style={{flex:'1 1 70px'}}>
            <label>Décoration</label>
            <select value={ltTextDecoration} onChange={e=>setLtTextDecoration(e.target.value)} style={{width:'100%'}}>
              <option value="none">Aucune</option>
              <option value="underline">Souligné</option>
              <option value="line-through">Barré</option>
            </select>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <div style={{flex:'1 1 120px'}}>
            <label>Couleur texte</label>
            <input type="color" value={ltTextColor} onChange={e=>setLtTextColor(e.target.value)} style={{width:'100%'}} />
          </div>
          <div style={{flex:'1 1 120px'}}>
            <label>Contour texte</label>
            <input type="color" value={ltTextStrokeColor} onChange={e=>setLtTextStrokeColor(e.target.value)} style={{width:'100%'}} />
          </div>
          <div style={{flex:'1 1 70px'}}>
            <label>Épaisseur contour</label>
            <input type="number" value={ltTextStrokeWidth} min={0} max={10} onChange={e=>setLtTextStrokeWidth(Number(e.target.value))} style={{width:'100%'}} />
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <div style={{flex:'1 1 120px'}}>
            <label>Couleur fond</label>
            <input type="color" value={ltBackgroundColor} onChange={e=>setLtBackgroundColor(e.target.value)} style={{width:'100%'}} />
          </div>
          <div style={{flex:'1 1 70px'}}>
            <label>Opacité fond</label>
            <input type="number" value={ltBackgroundOpacity} min={0} max={1} step={0.01} onChange={e=>setLtBackgroundOpacity(Number(e.target.value))} style={{width:'100%'}} />
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label>Logo dans le lower third</label>
          <input type="checkbox" checked={ltLogoInLowerThird} onChange={e=>setLtLogoInLowerThird(e.target.checked)} />
          <span style={{marginLeft:8}}>Position&nbsp;:
            <select value={ltLogoPosition} onChange={e=>setLtLogoPosition(e.target.value)} style={{marginLeft:4}}>
              <option value="left">Gauche</option>
              <option value="right">Droite</option>
            </select>
          </span>
        </div>

        {/* Aperçu en temps réel du lower third */}


        <div style={{margin:'18px 0 8px 0', border:'1px dashed #bbb', borderRadius:8, background:'#fafbfc', padding:10}}>
          <div style={{fontWeight:600, color:'#333', marginBottom:6}}>Aperçu en temps réel&nbsp;:</div>
          <LowerThirdPreview
            title={title || 'Titre de test'}


            subtitle={'Sous-titre exemple'}


            transitionIn={ltTransitionIn}


            transitionOut={ltTransitionOut}


            fontFamily={ltFontFamily}


            fontUrl={ltFontUrl}


            fontSize={ltFontSize}


            fontWeight={ltFontWeight}


            fontStyle={ltFontStyle}


            textDecoration={ltTextDecoration}


            textColor={ltTextColor}


            textStrokeColor={ltTextStrokeColor}


            textStrokeWidth={ltTextStrokeWidth}


            backgroundColor={ltBackgroundColor}


            backgroundOpacity={ltBackgroundOpacity}


            logoInLowerThird={ltLogoInLowerThird}


            logoPosition={ltLogoPosition}


            logoUrl={logoFile ? URL.createObjectURL(logoFile) : undefined}


          />
        </div>

        <div style={{display:'flex',gap:8,marginTop:12}}>
          <button type="submit" title="Ajouter" style={{color: 'white', background:'#43a047', border:'none', borderRadius:6, fontSize:18, padding:'6px 18px', fontWeight:600, cursor:'pointer'}}><FaPlus style={{marginRight:5}}/>Créer</button>
        </div>
      </div>
    </form>
  );
}



// Sous-composant pour afficher la liste
// Ajouter 'onSelect' aux props
import { FaPencilAlt, FaCheck, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';

import { useNavigate } from 'react-router-dom';

function ProgramDisplay({ programs, onDelete, onSelect }) {
  const [showModal, setShowModal] = useState(false);
  // États pour le formulaire d'ajout
  const [newProgramTitle, setNewProgramTitle] = useState("");
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [newLogoPosition, setNewLogoPosition] = useState("top-right");
  const [newLogoSize, setNewLogoSize] = useState(80);
  const [newLogoEffect, setNewLogoEffect] = useState("none");
  const [newLogoEffectIntensity, setNewLogoEffectIntensity] = useState(5);
  // Lower Third config
  const [ltTransitionIn, setLtTransitionIn] = useState('fade');
  const [ltTransitionOut, setLtTransitionOut] = useState('slide');
  const [ltFontFamily, setLtFontFamily] = useState('Roboto');
  const [ltFontUrl, setLtFontUrl] = useState('https://fonts.googleapis.com/css?family=Roboto');
  const [ltFontSize, setLtFontSize] = useState(32);
  const [ltFontWeight, setLtFontWeight] = useState('bold');
  const [ltFontStyle, setLtFontStyle] = useState('normal');
  const [ltTextDecoration, setLtTextDecoration] = useState('none');
  const [ltTextColor, setLtTextColor] = useState('#FFFFFF');
  const [ltTextStrokeColor, setLtTextStrokeColor] = useState('#000000');
  const [ltTextStrokeWidth, setLtTextStrokeWidth] = useState(2);
  const [ltBackgroundColor, setLtBackgroundColor] = useState('#181818');
  const [ltBackgroundOpacity, setLtBackgroundOpacity] = useState(0.97);
  const [ltLogoInLowerThird, setLtLogoInLowerThird] = useState(false);
  const [ltLogoPosition, setLtLogoPosition] = useState('left');
  const navigate = useNavigate();
  // Nouveau système d'édition : un seul programme édité à la fois, et tous les champs dans editFormState
  const [editingProgram, setEditingProgram] = useState(null);
  const [editFormState, setEditFormState] = useState(null);
  const [saving, setSaving] = useState(false);

  // Ouvre le modal d'édition avec le programme sélectionné
  const handleEditClick = (program) => {
    setEditingProgram(program);
    setEditFormState({
      title: program.title,
      logoFile: null,
      logoPreview: program.logoUrl ? `http://localhost:3001${program.logoUrl}` : null,
      logoPosition: program.logoPosition || 'top-right',
      logoSize: program.logoSize || 80,
      logoEffect: program.logoEffect || 'none',
      logoEffectIntensity: program.logoEffectIntensity || 5,
      ltTransitionIn: program.ltTransitionIn || 'fade',
      ltTransitionOut: program.ltTransitionOut || 'slide',
      ltFontFamily: program.ltFontFamily || 'Roboto',
      ltFontUrl: program.ltFontUrl || '',
      ltFontSize: program.ltFontSize || 32,
      ltFontWeight: program.ltFontWeight || 'normal',
      ltFontStyle: program.ltFontStyle || 'normal',
      ltTextDecoration: program.ltTextDecoration || 'none',
      ltTextColor: program.ltTextColor || '#fff',
      ltTextStrokeColor: program.ltTextStrokeColor || '#000',
      ltTextStrokeWidth: program.ltTextStrokeWidth || 0,
      ltBackgroundColor: program.ltBackgroundColor || '#181818',
      ltBackgroundOpacity: program.ltBackgroundOpacity || 0.97,
      ltLogoInLowerThird: program.ltLogoInLowerThird || false,
      ltLogoPosition: program.ltLogoPosition || 'left',
    });
  };

  const handleEditCancel = () => {
    setEditingProgram(null);
    setEditFormState(null);
  };

  const handleEditChange = (field, value) => {
    setEditFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editingProgram) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', editFormState.title);
      if (editFormState.logoFile) formData.append('logo', editFormState.logoFile);
      formData.append('logoPosition', editFormState.logoPosition);
      formData.append('logoSize', editFormState.logoSize);
      formData.append('logoEffect', editFormState.logoEffect);
      formData.append('logoEffectIntensity', editFormState.logoEffectIntensity);
      formData.append('ltTransitionIn', editFormState.ltTransitionIn);
      formData.append('ltTransitionOut', editFormState.ltTransitionOut);
      formData.append('ltFontFamily', editFormState.ltFontFamily);
      formData.append('ltFontUrl', editFormState.ltFontUrl);
      formData.append('ltFontSize', editFormState.ltFontSize);
      formData.append('ltFontWeight', editFormState.ltFontWeight);
      formData.append('ltFontStyle', editFormState.ltFontStyle);
      formData.append('ltTextDecoration', editFormState.ltTextDecoration);
      formData.append('ltTextColor', editFormState.ltTextColor);
      formData.append('ltTextStrokeColor', editFormState.ltTextStrokeColor);
      formData.append('ltTextStrokeWidth', editFormState.ltTextStrokeWidth);
      formData.append('ltBackgroundColor', editFormState.ltBackgroundColor);
      formData.append('ltBackgroundOpacity', editFormState.ltBackgroundOpacity);
      formData.append('ltLogoInLowerThird', editFormState.ltLogoInLowerThird);
      formData.append('ltLogoPosition', editFormState.ltLogoPosition);
      await updateProgram(editingProgram.id, formData);
      setEditingProgram(null);
      setEditFormState(null);
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageContentScrollable} style={{position:'relative'}}>
      <div className={styles.stickyHeader + ' sticky-header'}>
        <div className={styles.headerRow + ' header-row'}>
          <h2>Liste des Programmes</h2>
          <button
            className={styles.addProgramBtnFlottant + ' add-program-btn-flottant'}
            title="Ajouter un programme"
            aria-label="Ajouter un programme"
            onClick={() => setShowModal(true)}
            type="button"
          >
            <FaPlus style={{ fontSize: 28, display: 'block', margin: 0, padding: 0 }} />
          </button>
        </div>
      </div>
      {/* Modal d'ajout */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <ProgramForm
          onSubmit={e => { e.preventDefault(); /* Ajoute ici la logique d'ajout réelle */ setShowModal(false); }}
          title={newProgramTitle}
          setTitle={setNewProgramTitle}
          logoFile={newLogoFile}
          setLogoFile={setNewLogoFile}
          logoPosition={newLogoPosition}
          setLogoPosition={setNewLogoPosition}
          logoSize={newLogoSize}
          setLogoSize={setNewLogoSize}
          logoEffect={newLogoEffect}
          setLogoEffect={setNewLogoEffect}
          logoEffectIntensity={newLogoEffectIntensity}
          setLogoEffectIntensity={setNewLogoEffectIntensity}
          ltTransitionIn={ltTransitionIn}
          setLtTransitionIn={setLtTransitionIn}
          ltTransitionOut={ltTransitionOut}
          setLtTransitionOut={setLtTransitionOut}
          ltFontFamily={ltFontFamily}
          setLtFontFamily={setLtFontFamily}
          ltFontUrl={ltFontUrl}
          setLtFontUrl={setLtFontUrl}
          ltFontSize={ltFontSize}
          setLtFontSize={setLtFontSize}
          ltFontWeight={ltFontWeight}
          setLtFontWeight={setLtFontWeight}
          ltFontStyle={ltFontStyle}
          setLtFontStyle={setLtFontStyle}
          ltTextDecoration={ltTextDecoration}
          setLtTextDecoration={setLtTextDecoration}
          ltTextColor={ltTextColor}
          setLtTextColor={setLtTextColor}
          ltTextStrokeColor={ltTextStrokeColor}
          setLtTextStrokeColor={setLtTextStrokeColor}
          ltTextStrokeWidth={ltTextStrokeWidth}
          setLtTextStrokeWidth={setLtTextStrokeWidth}
          ltBackgroundColor={ltBackgroundColor}
          setLtBackgroundColor={setLtBackgroundColor}
          ltBackgroundOpacity={ltBackgroundOpacity}
          setLtBackgroundOpacity={setLtBackgroundOpacity}
          ltLogoInLowerThird={ltLogoInLowerThird}
          setLtLogoInLowerThird={setLtLogoInLowerThird}
          ltLogoPosition={ltLogoPosition}
          setLtLogoPosition={setLtLogoPosition}
        />
      </Modal>
      <div className={styles.programsGrid} style={{clear:'both'}}>
        {programs.length === 0 ? (
          <p style={{textAlign:'center',color:'#888',fontSize:18,margin:'48px 0'}}>Aucun programme trouvé.</p>
        ) : (
          programs.map((program) => {
            const imageUrl = program.logoUrl ? `http://localhost:3001${program.logoUrl}` : defaultLogo;
            return (
              <div
                key={program.id}
                className={styles.programCard}
                tabIndex={0}
                role="button"
                style={{ cursor: 'pointer' }}
                onClick={e => {
                  // Ne pas naviguer si clic sur un bouton d'action
                  if (e.target.closest('button')) return;
                  navigate(`/program/${program.id}/episodes`);
                }}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) {
                    navigate(`/program/${program.id}/episodes`);
                  }
                }}
              >
                <img
                  src={imageUrl}
                  alt={program.title}
                  className={styles.programLogo}
                  loading="lazy"
                />
                <div className={styles.programInfo}>
                  <div className={styles.programTitle}>{program.title}</div>
                  <div className={styles.programActions}>
                    <button onClick={e => { e.stopPropagation(); handleEditClick(program); }} className={styles.programEditBtn} title="Modifier">
                      <FaPencilAlt />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete(program.id); }} className={styles.programDeleteBtn} title="Supprimer">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Modal d'édition */}
      <Modal open={!!editingProgram} onClose={handleEditCancel}>
        {editFormState && (
          <ProgramForm
            onSubmit={e => { e.preventDefault(); handleEditSave(); }}
            title={editFormState.title}
            setTitle={val => handleEditChange('title', val)}
            logoFile={editFormState.logoFile}
            setLogoFile={file => handleEditChange('logoFile', file)}
            logoPosition={editFormState.logoPosition}
            setLogoPosition={val => handleEditChange('logoPosition', val)}
            logoSize={editFormState.logoSize}
            setLogoSize={val => handleEditChange('logoSize', val)}
            logoEffect={editFormState.logoEffect}
            setLogoEffect={val => handleEditChange('logoEffect', val)}
            logoEffectIntensity={editFormState.logoEffectIntensity}
            setLogoEffectIntensity={val => handleEditChange('logoEffectIntensity', val)}
            ltTransitionIn={editFormState.ltTransitionIn}
            setLtTransitionIn={val => handleEditChange('ltTransitionIn', val)}
            ltTransitionOut={editFormState.ltTransitionOut}
            setLtTransitionOut={val => handleEditChange('ltTransitionOut', val)}
            ltFontFamily={editFormState.ltFontFamily}
            setLtFontFamily={val => handleEditChange('ltFontFamily', val)}
            ltFontUrl={editFormState.ltFontUrl}
            setLtFontUrl={val => handleEditChange('ltFontUrl', val)}
            ltFontSize={editFormState.ltFontSize}
            setLtFontSize={val => handleEditChange('ltFontSize', val)}
            ltFontWeight={editFormState.ltFontWeight}
            setLtFontWeight={val => handleEditChange('ltFontWeight', val)}
            ltFontStyle={editFormState.ltFontStyle}
            setLtFontStyle={val => handleEditChange('ltFontStyle', val)}
            ltTextDecoration={editFormState.ltTextDecoration}
            setLtTextDecoration={val => handleEditChange('ltTextDecoration', val)}
            ltTextColor={editFormState.ltTextColor}
            setLtTextColor={val => handleEditChange('ltTextColor', val)}
            ltTextStrokeColor={editFormState.ltTextStrokeColor}
            setLtTextStrokeColor={val => handleEditChange('ltTextStrokeColor', val)}
            ltTextStrokeWidth={editFormState.ltTextStrokeWidth}
            setLtTextStrokeWidth={val => handleEditChange('ltTextStrokeWidth', val)}
            ltBackgroundColor={editFormState.ltBackgroundColor}
            setLtBackgroundColor={val => handleEditChange('ltBackgroundColor', val)}
            ltBackgroundOpacity={editFormState.ltBackgroundOpacity}
            setLtBackgroundOpacity={val => handleEditChange('ltBackgroundOpacity', val)}
            ltLogoInLowerThird={editFormState.ltLogoInLowerThird}
            setLtLogoInLowerThird={val => handleEditChange('ltLogoInLowerThird', val)}
            ltLogoPosition={editFormState.ltLogoPosition}
            setLtLogoPosition={val => handleEditChange('ltLogoPosition', val)}
            // Ajoute l'aperçu du logo existant si pas de nouveau fichier
            logoPreview={editFormState.logoPreview}
            isEditMode={true}
            saving={saving}
          />
        )}
      </Modal>
    </div>
  );
}
export default ProgramList;
