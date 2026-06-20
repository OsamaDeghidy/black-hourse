import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/App.tsx',
  'src/components/AIAssistant.tsx',
  'src/components/AuditControlPanel.tsx',
  'src/components/CustomerMarketplace.tsx',
  'src/components/CustomerOrderManager.tsx',
  'src/components/GoogleSheetsSync.tsx',
  'src/components/LoginScreen.tsx',
  'src/components/SalesManager.tsx',
  'src/components/StockManager.tsx'
];

const replacements = {
  'bg-neutral-900': 'bg-surface-card',
  'bg-neutral-800': 'bg-surface-card-hover',
  'bg-neutral-950': 'bg-surface-base',
  'border-neutral-900': 'border-surface-border',
  'border-neutral-850': 'border-surface-border',
  'border-neutral-800': 'border-surface-border',
  'border-neutral-700': 'border-surface-border',
  'text-neutral-400': 'text-text-secondary',
  'text-neutral-300': 'text-text-secondary',
  'text-neutral-500': 'text-text-tertiary',
  'text-neutral-100': 'text-text-primary',
  'text-black': 'text-surface-base',
  'border-black': 'border-surface-base',
  'bg-black': 'bg-surface-base',
};

filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      content = content.replace(regex, value);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
