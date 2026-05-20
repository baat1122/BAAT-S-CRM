const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'order-form', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace background colors
content = content.replace(/#050a18/g, '#f8fafc');
content = content.replace(/#0a1628/g, '#f1f5f9');
content = content.replace(/rgba\(15,23,42,0\.8\)/g, '#ffffff');
content = content.replace(/rgba\(15,23,42,0\.6\)/g, '#ffffff');
content = content.replace(/rgba\(0,0,0,0\.3\)/g, '#f8fafc');
content = content.replace(/rgba\(0,0,0,0\.2\)/g, '#f8fafc');
content = content.replace(/rgba\(255,255,255,0\.03\)/g, '#f1f5f9');
content = content.replace(/rgba\(255,255,255,0\.08\)/g, '#e2e8f0');

// Replace borders
content = content.replace(/rgba\(51,65,85,0\.6\)/g, '#cbd5e1');
content = content.replace(/rgba\(51,65,85,0\.5\)/g, '#e2e8f0');
content = content.replace(/rgba\(51,65,85,0\.4\)/g, '#e2e8f0');
content = content.replace(/rgba\(51,65,85,0\.8\)/g, '#94a3b8');

// Replace text colors
content = content.replace(/#f1f5f9/g, '#0f172a'); // primary text
content = content.replace(/#94a3b8/g, '#475569'); // secondary text
// content = content.replace(/#64748b/g, '#64748b'); // tertiary text (stays same)
content = content.replace(/#475569/g, '#94a3b8'); // dark text becomes lighter placeholder

// Replace accents
content = content.replace(/#00f0ff/g, '#0284c7'); // neon cyan -> dark sky blue for readability
content = content.replace(/#0ea5e9/g, '#0369a1'); 

// Specific overrides for the buttons and headers
content = content.replace(/background: "transparent"/g, 'background: "#f1f5f9"');
content = content.replace(/color: submitting \? "#94a3b8" : "#050a18"/g, 'color: submitting ? "#94a3b8" : "#ffffff"');
content = content.replace(/color: "#050a18"/g, 'color: "#ffffff"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Order form converted to light mode.');
