export default function StrategyBanner({ weekOfMonth, activeCategory, theme }) {
  return (
    <div className="strategy-banner">
       <div>
          <div className="strategy-title">
            Week {weekOfMonth} Strategy
          </div>
          <div className="strategy-category">
            Category: {activeCategory}
          </div>
       </div>
       <div className="theme-badge">{theme}</div>
    </div>
  );
}
