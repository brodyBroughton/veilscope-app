export default function Statusbar() {
  return (
    <footer className="statusbar" role="contentinfo">
      <div className="status-item">EDGAR: <span className="status-dot ok"></span> reachable</div>
      <div className="status-item">Rate limit: —</div>
      <div className="status-item">Last sync: —</div>
    </footer>
  );
}
