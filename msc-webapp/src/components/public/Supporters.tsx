import { useId } from 'react';
import logos from '../../content/supporterLogos.json';

const programs = [{ id: 'microsoft', program: 'Microsoft Campus Club' }, { id: 'github', program: 'GitHub Campus Expert' }];

export function SupporterPrograms() {
  return <div className="club-program-band" role="group" aria-label="Microsoft and GitHub student program support"><div className="club-container"><p className="club-program-label">SUPPORTED THROUGH</p><div className="club-program-logos">{programs.map(program => {
    const logo = logos.find(item => item.id === program.id);
    return logo ? <div key={logo.id}><img src={logo.src} alt={`${logo.name} logo`} width={logo.width} height={logo.height} loading="lazy" /><span>{program.program}</span></div> : null;
  })}</div></div></div>;
}

export function SupporterWall() {
  const titleId = useId();
  return <section className="club-section club-supporters" aria-labelledby={titleId}><div className="club-container"><div className="club-section-heading"><div><span className="club-eyebrow">OUR COMMUNITY</span><h2 id={titleId}>Sponsors & supporters</h2></div></div></div><SupporterPrograms /><div className="club-container club-supporter-grid">{logos.filter(logo => !programs.some(program => program.id === logo.id)).map(logo => <div key={logo.id} className="club-supporter-logo"><img src={logo.src} alt={`${logo.name} logo`} title={logo.name} width={logo.width} height={logo.height} loading="lazy" /></div>)}</div></section>;
}