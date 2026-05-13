// Lightweight stub – the real bundle is too large for jest-runtime's readFileBuffer.
// Returns a Proxy so any named icon import resolves to a no-op React component.
const handler = {
  get(_target, prop) {
    if (prop === '__esModule') return true;
    // Return a minimal functional component for every icon
    const Icon = () => null;
    Icon.displayName = prop;
    return Icon;
  },
};

module.exports = new Proxy({}, handler);
