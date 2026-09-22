/* ============ ÉQUIPEMENTS MOTO (jeu de mémoire) ============ */
/* Statut réglementaire vérifié : seuls le casque homologué et les gants certifiés CE
   sont obligatoires en France. Le gilet haute visibilité doit être présent à bord. */
const EQUIPMENT_POOL = [
  { icon:'casque', name:'Casque homologué', status:'obl', badge:'Obligatoire',
    fact:"Obligatoire pour le conducteur et le passager depuis 1973. Il doit être homologué ECE et correctement attaché. Sans casque : 135 € d'amende et 3 points en moins." },
  { icon:'gants', name:'Gants certifiés CE', status:'obl', badge:'Obligatoire',
    fact:"Obligatoires depuis novembre 2016, pour le conducteur comme le passager. En cas de chute, les mains touchent le sol en premier par réflexe. Sans gants : 68 € et 1 point." },
  { icon:'gilet', name:'Gilet haute visibilité', status:'obl', badge:'Obligatoire à bord',
    fact:"Il doit être présent à bord, sans être porté en permanence. Il faut l'enfiler en cas d'arrêt d'urgence, pour rester visible des autres usagers." },
  { icon:'blouson', name:'Blouson renforcé', status:'rec', badge:'Fortement recommandé',
    fact:"Pas obligatoire, mais c'est lui qui protège le torse, les épaules et les coudes. Cherchez des protections certifiées CE aux articulations et une dorsale." },
  { icon:'pantalon', name:'Pantalon renforcé', status:'rec', badge:'Fortement recommandé',
    fact:"Un jean ordinaire s'use en moins d'une seconde sur le bitume. Un pantalon moto renforcé évite des brûlures profondes aux jambes et aux hanches." },
  { icon:'bottes', name:'Bottes montantes', status:'rec', badge:'Fortement recommandé',
    fact:"Les chevilles sont très exposées lors d'une chute, notamment sous le poids de la moto. Des chaussures montantes limitent fractures et entorses graves." },
  { icon:'dorsale', name:'Protection dorsale', status:'rec', badge:'Fortement recommandé',
    fact:"Elle protège la colonne vertébrale, dont les lésions comptent parmi les plus invalidantes. Intégrée au blouson ou portée en gilet séparé." },
  { icon:'airbag', name:'Airbag moto', status:'rec', badge:'Recommandé',
    fact:"Gilet ou blouson qui se gonfle en une fraction de seconde lors d'une chute. Il réduit fortement les chocs au thorax, au cou et à la colonne." },
  { icon:'ecran', name:'Écran ou lunettes', status:'rec', badge:'Fortement recommandé',
    fact:"À moto, un insecte ou un gravillon dans l'œil suffit à provoquer une perte de contrôle. Écran de casque ou lunettes adaptées sont indispensables." },
  { icon:'genoux', name:'Protections genoux', status:'rec', badge:'Recommandé',
    fact:"Les genoux encaissent souvent le premier impact lors d'une chute. Des coques intégrées au pantalon limitent fractures et lésions articulaires." },
  { icon:'cervicale', name:'Protection cervicale', status:'rec', badge:'Recommandé',
    fact:"Elle limite les mouvements extrêmes du cou lors d'un choc. Particulièrement utile sur route ouverte et en pratique sportive." },
  { icon:'bouchons', name:"Bouchons d'oreille", status:'rec', badge:'Recommandé',
    fact:"Au-delà de 90 km/h, le bruit du vent dépasse le seuil de risque auditif. Les bouchons réduisent aussi la fatigue sur les longs trajets." },
  { icon:'pluie', name:'Équipement de pluie', status:'rec', badge:'Recommandé',
    fact:"Un motard trempé perd en concentration et en réactivité. Une tenue imperméable maintient la vigilance, essentielle sous la pluie." },
  { icon:'visible', name:'Tenue visible', status:'rec', badge:'Fortement recommandé',
    fact:"« Je ne l'ai pas vu » revient sans cesse après un accident de deux-roues. Couleurs claires et bandes rétroréfléchissantes augmentent nettement la visibilité." }
];
