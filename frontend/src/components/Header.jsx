import InstallPromptButton from './InstallPromptButton';

export default function Header() {
  return (
    <header className="header" role="banner">
      <div className="header-brand-row">
        <h1>SirviniStyles</h1>
        <InstallPromptButton />
      </div>
      <p>Sales-First Daily Content Packet</p>
    </header>
  );
}
