/**
 * Giải Pháp Dynamic CSS Engine (FSE Level 2)
 * Biến đổi các mảng Styles lưu trong section JSON thành một khối CSS khổng lồ theo quy ước:
 * - `.sf-node-{id}` cho Base (Desktop).
 * - `.sf-node-{id}:hover` cho Hover.
 * - `@media (max-width: ...)` cho Mobile/Tablet.
 */

export function toCssString(styleObj) {
  if (!styleObj || typeof styleObj !== 'object') return '';
  let css = '';
  for (const [key, value] of Object.entries(styleObj)) {
    if (value !== undefined && value !== null && value !== '') {
      // camelCase -> kebab-case
      const cssProp = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      css += `${cssProp}: ${value};\n`;
    }
  }
  return css;
}

export function generateDynamicCss(sections, themeConfig = {}) {
  let rootCss = '';
  
  if (themeConfig && Object.keys(themeConfig).length > 0) {
    let vars = '';
    if (themeConfig.primaryColor) vars += `--sf-primary: ${themeConfig.primaryColor};\n`;
    if (themeConfig.accentColor) vars += `--sf-accent: ${themeConfig.accentColor};\n`;
    if (themeConfig.backgroundColor) vars += `--sf-bg: ${themeConfig.backgroundColor};\n`;
    if (themeConfig.textColor) vars += `--sf-text: ${themeConfig.textColor};\n`;
    if (themeConfig.fontFamily) vars += `--sf-font: ${themeConfig.fontFamily};\n`;
    if (themeConfig.borderRadius) vars += `--sf-radius: ${themeConfig.borderRadius};\n`;
    if (themeConfig.containerWidth) vars += `--sf-container: ${themeConfig.containerWidth};\n`;
    
    if (vars) {
      rootCss = `:root {\n${vars}}\nbody { font-family: var(--sf-font, inherit); background-color: var(--sf-bg, #fff); color: var(--sf-text, #333); }\n`;
    }
  }

  let desktopCss = '';
  let tabletCss = '';
  let mobileCss = '';

  const traverse = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node.id) continue;
      const selector = `.sf-node-${node.id}`;
      
      const st = node.settings || {};
      
      // Default / Desktop
      if (st.style && Object.keys(st.style).length > 0) {
        desktopCss += `${selector} { ${toCssString(st.style)} }\n`;
      }
      if (st.hoverStyle && Object.keys(st.hoverStyle).length > 0) {
        // Hỗ trợ mượt (transition) nếu có hoverStyle nhưng user chưa custom transition ở thẻ gốc
        if (!st.style || !st.style.transition) {
          desktopCss += `${selector} { transition: all 0.2s ease; }\n`;
        }
        desktopCss += `${selector}:hover { ${toCssString(st.hoverStyle)} }\n`;
      }
      
      // Tablet (<= 1024px)
      if (st.tabletStyle && Object.keys(st.tabletStyle).length > 0) {
        tabletCss += `${selector} { ${toCssString(st.tabletStyle)} }\n`;
      }
      if (st.tabletHoverStyle && Object.keys(st.tabletHoverStyle).length > 0) {
        tabletCss += `${selector}:hover { ${toCssString(st.tabletHoverStyle)} }\n`;
      }
      
      // Mobile (<= 768px)
      if (st.mobileStyle && Object.keys(st.mobileStyle).length > 0) {
        mobileCss += `${selector} { ${toCssString(st.mobileStyle)} }\n`;
      }
      if (st.mobileHoverStyle && Object.keys(st.mobileHoverStyle).length > 0) {
        mobileCss += `${selector}:hover { ${toCssString(st.mobileHoverStyle)} }\n`;
      }
      
      // Visibility Constraints
      if (st.hiddenDesktop) {
        desktopCss += `@media (min-width: 1025px) { ${selector} { display: none !important; } }\n`;
      }
      if (st.hiddenTablet) {
        desktopCss += `@media (min-width: 769px) and (max-width: 1024px) { ${selector} { display: none !important; } }\n`;
      }
      if (st.hiddenMobile) {
        desktopCss += `@media (max-width: 768px) { ${selector} { display: none !important; } }\n`;
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };

  traverse(sections);

  let finalCss = rootCss + '\n' + desktopCss;
  if (tabletCss) {
    finalCss += `\n@media (max-width: 1024px) {\n${tabletCss}}\n`;
  }
  if (mobileCss) {
    finalCss += `\n@media (max-width: 768px) {\n${mobileCss}}\n`;
  }

  return finalCss;
}

export function injectDynamicCss(cssString) {
  if (typeof document === 'undefined') return;
  let styleEl = document.getElementById('sf-dynamic-global-css');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'sf-dynamic-global-css';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssString;
}
