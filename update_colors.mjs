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
  'bg-zinc-900': 'bg-surface-card',
  'bg-zinc-800': 'bg-surface-card-hover',
  'bg-zinc-950': 'bg-surface-base',
  'border-zinc-800': 'border-surface-border',
  'border-zinc-700': 'border-surface-border',
  'text-emerald-400': 'text-brand-light',
  'text-emerald-500': 'text-brand',
  'bg-emerald-500': 'bg-brand',
  'bg-emerald-600': 'bg-brand-dark',
  'text-zinc-400': 'text-text-secondary',
  'text-zinc-300': 'text-text-secondary',
  'text-zinc-100': 'text-text-primary',
  'text-white': 'text-text-primary'
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
