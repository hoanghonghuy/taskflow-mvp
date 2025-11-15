'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useTranslation } from '../../hooks/useI18n';
import { useSettings } from '../../hooks/useSettings';

const CELL_SIZE = 12; // Corresponds to w-3
const CELL_GAP = 4;   // Corresponds to gap-1
const WEEK_WIDTH = CELL_SIZE + CELL_GAP;
const DAY_LABELS_WIDTH = 30; // Approx width for 'Mon', 'Wed', 'Fri' labels and margin
const COLOR_SCALE = ['bg-secondary', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'] as const;

const ProductivityHeatmap: React.FC = () => {
    const { state } = useTaskManager();
    const { t } = useTranslation();
    const { language } = useSettings();
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Get container width on resize
    useEffect(() => {
        const element = containerRef.current;
        if (!element) {
            return;
        }

        const updateWidth = () => setContainerWidth(element.getBoundingClientRect().width);
        updateWidth();

        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, []);

    const { contributions, maxContribution } = useMemo(() => {
        const contribs: { [date: string]: { tasks: number, pomos: number, total: number } } = {};
        let max = 1;

        state.tasks.forEach(task => {
            if (task.completed && task.completedAt) {
                const dateStr = new Date(task.completedAt).toISOString().split('T')[0];
                if (!contribs[dateStr]) contribs[dateStr] = { tasks: 0, pomos: 0, total: 0 };
                contribs[dateStr].tasks += 1;
                contribs[dateStr].total += 2;
                if (contribs[dateStr].total > max) max = contribs[dateStr].total;
            }
        });

        state.pomodoro.focusHistory.forEach(session => {
            const dateStr = new Date(session.startTime).toISOString().split('T')[0];
            if (!contribs[dateStr]) contribs[dateStr] = { tasks: 0, pomos: 0, total: 0 };
            contribs[dateStr].pomos += 1;
            contribs[dateStr].total += 1;
            if (contribs[dateStr].total > max) max = contribs[dateStr].total;
        });

        return { contributions: contribs, maxContribution: max };
    }, [state.tasks, state.pomodoro.focusHistory]);

    // Calculate which days and month labels to show based on width
    const { weeks, monthLabels, dayLabels } = useMemo(() => {
        const localDayLabels = Array.from({ length: 7 }, (_, i) => {
             // A known Sunday is Jan 7, 2024
            const day = new Date(2024, 0, 7 + i); 
            return day.toLocaleDateString(language, { weekday: 'short' });
        });

        if (containerWidth === 0) {
            return { weeks: [], monthLabels: [], dayLabels: localDayLabels };
        }

        const availableWidth = containerWidth > DAY_LABELS_WIDTH ? containerWidth - DAY_LABELS_WIDTH : 0;
        const numWeeks = Math.max(1, Math.min(52, Math.floor(availableWidth / WEEK_WIDTH)));
        
        const today = new Date();
        const endDate = new Date(today);
        // Align to the end of the week (Saturday) to ensure full columns
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        const days = [];
        for (let i = 0; i < numWeeks * 7; i++) {
            const date = new Date(endDate);
            date.setDate(endDate.getDate() - i);
            days.push(date);
        }
        days.reverse();
        
        const weeksData = [];
        const labels: { label: string, index: number }[] = [];
        let lastMonth = -1;

        for (let i = 0; i < numWeeks; i++) {
            const week = days.slice(i * 7, (i + 1) * 7);
            weeksData.push(week);

            // Find month label
            const firstDayOfWeek = week[0];
            if (firstDayOfWeek) {
                const month = firstDayOfWeek.getMonth();
                if (month !== lastMonth) {
                    const lastLabelIndex = labels.length > 0 ? labels[labels.length - 1].index : -5;
                    // Heuristic to prevent label overlap on smaller screens
                    if (i > lastLabelIndex + 3) { 
                        labels.push({ label: firstDayOfWeek.toLocaleDateString(language, { month: 'short' }), index: i });
                        lastMonth = month;
                    }
                }
            }
        }
        
        return { weeks: weeksData, monthLabels: labels, dayLabels: localDayLabels };

    }, [containerWidth, language]);
    
    const getColorClass = (count: number) => {
        if (count === 0) return COLOR_SCALE[0];
        const ratio = count / maxContribution;
        if (ratio < 0.25) return COLOR_SCALE[1];
        if (ratio < 0.5) return COLOR_SCALE[2];
        if (ratio < 0.75) return COLOR_SCALE[3];
        return COLOR_SCALE[4];
    };
    
    const getTooltipText = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const data = contributions[dateStr];
        const formattedDate = date.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        if (!data || data.total === 0) {
            return t('heatmap.tooltip.noActivity', { date: formattedDate });
        }
        
        return t('heatmap.tooltip.activity', {
            date: formattedDate,
            tasksCount: data.tasks,
            pomosCount: data.pomos
        });
    };

    return (
        <div
            ref={containerRef}
            className="bg-card border border-border/80 p-4 rounded-2xl shadow-sm"
            role="figure"
            aria-label={t('dashboard.heatmapTitle')}
        >
            <div className="flex flex-col">
                {/* Month Labels */}
                <div className="h-5 mb-1 relative" style={{ marginLeft: `${DAY_LABELS_WIDTH}px` }}>
                    {monthLabels.map(({ label, index }) => (
                        <div
                            key={label + index}
                            className="absolute top-0 text-[11px] text-muted-foreground"
                            style={{ left: `${index * WEEK_WIDTH}px` }}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    {/* Day Labels */}
                    <div
                        className="flex flex-col gap-1 text-xs text-muted-foreground pt-0.5"
                        style={{ minWidth: `${DAY_LABELS_WIDTH - 3}px`, width: `${DAY_LABELS_WIDTH - 3}px` }}
                        aria-hidden="true"
                    >
                        <div className="h-3" />
                        <div className="h-3">{dayLabels[1]}</div>
                        <div className="h-3" />
                        <div className="h-3">{dayLabels[3]}</div>
                        <div className="h-3" />
                        <div className="h-3">{dayLabels[5]}</div>
                        <div className="h-3" />
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex gap-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {week.map((day, dayIndex) => {
                                    if (!day) {
                                        return <div key={`empty-${weekIndex}-${dayIndex}`} className="w-3 h-3" aria-hidden="true" />;
                                    }
                                    const date = day as Date;
                                    const isoDate = date.toISOString().split('T')[0];
                                    const count = contributions[isoDate]?.total || 0;
                                    const isFuture = date > new Date();
                                    const tooltip = isFuture ? t('heatmap.tooltip.future') : getTooltipText(date);

                                    return (
                                        <div
                                            key={isoDate}
                                            className={`w-3 h-3 rounded-sm transition-colors duration-200 ${isFuture ? 'bg-muted/20' : getColorClass(count)}`}
                                            title={tooltip}
                                            role="presentation"
                                            aria-hidden="true"
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                    <span className="font-medium">{t('dashboard.heatmapTitle')}</span>
                    <div className="flex items-center gap-2">
                        <span>{t('heatmap.legend.less')}</span>
                        <div className="flex items-center gap-1" aria-hidden="true">
                            {COLOR_SCALE.map(color => (
                                <span key={color} className={`w-3 h-3 rounded-sm ${color}`} />
                            ))}
                        </div>
                        <span>{t('heatmap.legend.more')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductivityHeatmap;
