/**
 * Component to display case reasons with improved formatting
 * - Parses Discord role mentions (<@&ID>) and displays them as role badges
 * - Highlights automatic bans
 */

interface CaseReasonProps {
  reasonText: string;
  type: string;
  createdById: string;
  roleMapping?: Record<string, string>;
}

export function CaseReason({ reasonText, type, createdById, roleMapping = {} }: CaseReasonProps) {
  const isAutomatic = createdById === 'system' || reasonText.includes('Automatischer Ban');
  
  // Parse role mentions from reasonText
  const parseReason = (text: string) => {
    // Match <@&roleId> pattern
    const rolePattern = /<@&(\d+)>/g;
    const parts: (string | { type: 'role'; id: string })[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = rolePattern.exec(text)) !== null) {
      // Add text before the role mention
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      // Add the role mention
      parts.push({ type: 'role', id: match[1] });
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts;
  };
  
  const parts = parseReason(reasonText);
  
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isAutomatic && (
        <span 
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          Automatisch
        </span>
      )}
      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
        {parts.map((part, index) => {
          if (typeof part === 'string') {
            // Clean up "Automatischer Ban:" prefix since we show it as badge
            const cleaned = part.replace(/^Automatischer Ban:\s*/i, '');
            return <span key={index}>{cleaned}</span>;
          } else {
            // Role mention
            const roleName = roleMapping[part.id];
            return (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
                style={{ 
                  backgroundColor: 'var(--blue-bg)',
                  color: 'var(--blue)',
                  fontFamily: roleName ? undefined : 'var(--font-mono)'
                }}
                title={`Rolle ID: ${part.id}`}
              >
                {roleName ? `@${roleName}` : `@Rolle ${part.id.slice(0, 6)}…`}
              </span>
            );
          }
        })}
      </span>
    </div>
  );
}
