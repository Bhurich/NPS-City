'use client';

import React, { useMemo } from 'react';
import { Check, Circle, Zap, Leaf, Users, ShieldCheck, Banknote, Trophy } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import {
  getMissionProgress,
  getNpsChallengeSummary,
  NPS_SEASON_LENGTH_DAYS,
  NpsScoreKey,
} from '@/lib/npsChallenge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

const SCORE_META: Record<NpsScoreKey, { label: string; icon: React.ReactNode; color: string }> = {
  economy: { label: 'เศรษฐกิจ', icon: <Banknote className="h-4 w-4" />, color: 'bg-amber-500' },
  energy: { label: 'พลังงานมั่นคง', icon: <Zap className="h-4 w-4" />, color: 'bg-sky-500' },
  environment: { label: 'สิ่งแวดล้อม', icon: <Leaf className="h-4 w-4" />, color: 'bg-emerald-500' },
  community: { label: 'ชุมชน', icon: <Users className="h-4 w-4" />, color: 'bg-rose-500' },
  safety: { label: 'ความปลอดภัย', icon: <ShieldCheck className="h-4 w-4" />, color: 'bg-indigo-500' },
};

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString()} NPS`;
}

function ScoreRow({ scoreKey, value }: { scoreKey: NpsScoreKey; value: number }) {
  const meta = SCORE_META[scoreKey];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <span className="text-muted-foreground">{meta.icon}</span>
          <span>{meta.label}</span>
        </div>
        <span className="font-mono tabular-nums font-semibold">{value}</span>
      </div>
      <Progress value={value} className="h-2 bg-muted" indicatorClassName={meta.color} />
    </div>
  );
}

export function NpsChallengePanel() {
  const { state, setActivePanel } = useGame();
  const summary = useMemo(() => getNpsChallengeSummary(state), [state]);
  const missionCompletion = summary.completedMissions.length;
  const campaignProgress = Math.round((summary.campaignDay / NPS_SEASON_LENGTH_DAYS) * 100);

  return (
    <Dialog open={true} onOpenChange={() => setActivePanel('none')}>
      <DialogContent className="max-w-[840px] max-h-[86vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            NPS City: 14-Day Smart Land Challenge
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(86vh-74px)]">
          <div className="p-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">NPS City Score</div>
                    <div className="mt-1 flex items-end gap-2">
                      <span className="text-5xl font-black leading-none tabular-nums text-foreground">{summary.score}</span>
                      <span className="pb-1 text-muted-foreground">/ 100</span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      เมืองเลเวล {summary.cityLevel} · ทำภารกิจแล้ว {missionCompletion}/{summary.availableMissions.length}
                    </div>
                  </div>
                  <div className="min-w-[180px] flex-1 max-w-[260px]">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>วันที่ {summary.campaignDay}</span>
                      <span>{NPS_SEASON_LENGTH_DAYS} วัน</span>
                    </div>
                    <Progress value={campaignProgress} className="h-2" />
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {summary.awardHints.map((award) => (
                        <Badge key={award} variant="secondary" className="text-[10px]">{award}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">เหตุการณ์ปัจจุบัน</div>
                {summary.activeEvent ? (
                  <div className="mt-2 space-y-2">
                    <div className="font-semibold text-foreground">{summary.activeEvent.title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{summary.activeEvent.description}</p>
                    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      {summary.activeEvent.impact}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">เริ่มสร้างเมืองให้พร้อมรับภารกิจแรก</p>
                )}
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <Card className="p-4 space-y-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">คะแนนสมดุล 5 ด้าน</div>
                  <div className="text-xs text-muted-foreground">เศรษฐกิจ 25% · พลังงาน 25% · สิ่งแวดล้อม 20% · ชุมชน 20% · ความปลอดภัย 10%</div>
                </div>
                <div className="space-y-3">
                  {(Object.keys(SCORE_META) as NpsScoreKey[]).map((scoreKey) => (
                    <ScoreRow key={scoreKey} scoreKey={scoreKey} value={summary.scores[scoreKey]} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Metric label="เงินคงเหลือ" value={formatMoney(state.stats.money)} />
                  <Metric label="รายได้สุทธิ/เดือน" value={formatMoney(summary.metrics.monthlyNetIncome)} />
                  <Metric label="กำลังผลิตไฟ" value={`${summary.metrics.energySupply}`} />
                  <Metric label="ใช้ไฟ" value={`${summary.metrics.energyDemand}`} />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">ภารกิจที่เปิดแล้ว</div>
                    <div className="text-xs text-muted-foreground">ทำครบเพื่อเพิ่มโอกาสชนะหลายประเภทรางวัล</div>
                  </div>
                  <Badge variant="outline">{missionCompletion} สำเร็จ</Badge>
                </div>
                <div className="space-y-3">
                  {summary.availableMissions.map((mission) => {
                    const progress = getMissionProgress(mission, summary.metrics, state);
                    return (
                      <div key={mission.id} className="rounded-md border border-border bg-background/60 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              {progress.complete ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium text-sm text-foreground">Day {mission.day}: {mission.title}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{mission.description}</p>
                          </div>
                          <Badge variant={progress.complete ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
                            +{mission.reward.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          {progress.checks.map((check) => (
                            <div key={check.label} className="flex items-center gap-2 text-xs">
                              {check.complete ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className={check.complete ? 'text-foreground' : 'text-muted-foreground'}>{check.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {summary.nextMissions.length > 0 && (
              <Card className="p-4">
                <div className="text-sm font-semibold text-foreground mb-2">ภารกิจถัดไป</div>
                <div className="grid gap-2 md:grid-cols-3">
                  {summary.nextMissions.map((mission) => (
                    <div key={mission.id} className="rounded-md bg-muted/50 px-3 py-2">
                      <div className="text-xs text-muted-foreground">Day {mission.day}</div>
                      <div className="text-sm font-medium text-foreground">{mission.title}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/70 p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-mono text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}
