import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useIntelligencePreferences } from '@/hooks/useIntelligencePreferences';
import type { IntelligencePrefs } from '@/lib/luna/intelligence-policy';

const ITEMS: { key: keyof IntelligencePrefs; title: string; text: string }[] = [
  { key: 'use_my_world_context', title: 'Use My World entries', text: 'Let Ask Ordiva read the entry you choose to explore, and your recent entries when you ask it to connect the dots.' },
  { key: 'use_my_rhythms_context', title: 'Use My Rhythms', text: 'Add a short cycle and sleep summary to those conversations.' },
  { key: 'allow_external_ai', title: "Send to Ask Ordiva's AI service", text: 'Personal material is processed by an outside AI provider to answer you. Nothing personal is sent while this is off.' },
  { key: 'allow_background_insights', title: 'Background insights', text: 'Allow insights to be prepared without you asking. Not active yet; stays off until you choose otherwise.' },
];

const IntelligenceSettingsCard: React.FC = () => {
  const { prefs, loading, set } = useIntelligencePreferences();
  const [err, setErr] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Personal intelligence</CardTitle>
        <p className="text-sm text-muted-foreground">Everything starts off. Each switch works on its own, and turning one off removes insights built from your entries.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {ITEMS.map((i) => (
          <label key={i.key} className="flex items-start justify-between gap-4">
            <span><span className="block text-sm font-medium">{i.title}</span><span className="block text-xs text-muted-foreground">{i.text}</span></span>
            <Switch disabled={loading} checked={prefs[i.key]} aria-label={i.title}
              onCheckedChange={(v) => set(i.key, v).then(() => setErr(null)).catch(() => setErr('That setting didn’t save. Please try again.'))} />
          </label>
        ))}
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
};
export default IntelligenceSettingsCard;
