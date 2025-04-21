// Utilitaire pour accessibilité : focus visible + aria-label sur boutons icônes
export function withAriaLabel(Component, label) {
  return (props) => <Component {...props} aria-label={label} tabIndex={0} />;
}
