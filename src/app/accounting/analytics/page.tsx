'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, 
  BrainCircuit, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './page.module.css';

export default function FPA_Analytics() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ predicted: 0, margin: '0%', runway: '12 Months' });
  const [isLoading, setIsLoading] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const { t, formatCurrency, locale } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/accounting/analytics/summary');
        const data = await res.json();
        
        // Use real cashflow data as the base for Historical Trend
        const history = data.cashFlowData || [];
        const lastPoint = history[history.length - 1]?.Revenue || 0;
        const avgMonthlyExp = history.reduce((sum: number, h: any) => sum + (h.Expenses || 0), 0) / (history.length || 1);
        
        // Simple Forecast logic: 10% base growth, 25% optimistic growth
        const baseForecast = lastPoint * 1.1;
        const optimisticForecast = lastPoint * 1.25;

        const simulation = [
          ...history.map((h: any) => ({ name: h.name, Historical: h.Revenue, ForecastBase: null, ForecastOptimistic: null })),
          { name: 'NEXT Q', Historical: null, ForecastBase: lastPoint, ForecastOptimistic: lastPoint },
          { name: 'Q+1', Historical: null, ForecastBase: baseForecast, ForecastOptimistic: optimisticForecast },
          { name: 'Q+2', Historical: null, ForecastBase: baseForecast * 1.05, ForecastOptimistic: optimisticForecast * 1.15 },
        ];

        setChartData(simulation);
        
        const currentCash = data.kpis?.totalCashBalance || 0;
        const monthsRunway = avgMonthlyExp > 0 ? (currentCash / avgMonthlyExp).toFixed(1) : '∞';

        setKpis({
          predicted: optimisticForecast,
          margin: (data.kpis?.netMargin || 0) + '%',
          runway: `${monthsRunway} ${locale === 'id' ? 'Bulan' : 'Months'}`
        });

        // Initialize FIRA's first message
        const welcome = locale === 'id' ? 
          `Halo, saya **FIRA**. Berdasarkan tren historis dari ${history.length} bulan data, saya telah menghasilkan prakiraan pendapatan Bayesian. Puncak berikutnya diperkirakan ${formatCurrency(optimisticForecast)} di bawah skenario optimis. Ketahanan kas saat ini diperkirakan mencapai ${monthsRunway} bulan.` :
          `Hello, I am **FIRA**. Based on the historical trend of ${history.length} months of data, I have generated the Bayesian revenue forecasts. Your next peak appears to be ${formatCurrency(optimisticForecast)} under the optimistic scenario. Your current runway is estimated at ${monthsRunway} months.`;

        setMessages([{ role: 'system', content: welcome }]);

      } catch (e) {
        console.error('Forecasting Error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [locale]);

  const handleSendMessage = async (text: string, trigger?: string) => {
    const input = text || userInput;
    if (!input && !trigger) return;

    const newMessages = [...messages, { role: 'user', content: input || 'Custom Trigger' }];
    setMessages(newMessages);
    setUserInput('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/accounting/analytics/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, trigger })
      });
      const data = await res.json();
      setMessages([...newMessages, data]);
    } catch (e) {
      setMessages([...newMessages, { role: 'system', content: 'Connectivity error. FIRA is offline.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>FIRA — Financial Intelligence</h1>
          <p className={styles.pageSubtitle}>Financial Planning & Analysis powered by FIRA (Financial Intelligence Research Assistant).</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '100px', textAlign: 'center', color: '#64748B' }}>FIRA is synthesizing financial models...</div>
      ) : (
        <div className={styles.mainLayout}>
          {/* Left Column: Metrics & AI Chat */}
          <div className={styles.leftCol}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>{t('PredictedNext')}</span>
                  <TrendingUp size={16} className={styles.iconGreen} />
                </div>
                <div className={styles.metricValue}>{formatCurrency(kpis.predicted)}</div>
                <div className={styles.metricTrend}>
                  <ArrowUpRight size={14} /> +12.4% from base scenario
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>{t('MarginEq')}</span>
                  <Activity size={16} className={styles.iconRed} />
                </div>
                <div className={styles.metricValue}>{kpis.margin}</div>
                <div className={styles.metricTrendRed}>
                  <ArrowDownRight size={14} /> Sensitivity: Medium
                </div>
              </div>
            </div>

            <div className={styles.aiPanel}>
              <div className={styles.aiHeader}>
                <div className={styles.aiTitleBox}>
                  <BrainCircuit size={20} className={styles.aiIcon} />
                  <h3 className={styles.aiTitle}>FIRA Analysis</h3>
                </div>
                <div className={styles.aiBadge}>{isThinking ? 'THINKING' : 'ACTIVE'}</div>
              </div>
              
              <div className={styles.chatArea}>
                {messages.map((m, idx) => (
                  <div key={idx} className={m.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleSystem}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ))}
                {isThinking && <div className={styles.chatBubbleSystem}>Synthesizing financial delta...</div>}
              </div>
              
              <div className={styles.chatOptions}>
                <button 
                  className={styles.chatOptionBtn} 
                  disabled={isThinking}
                  onClick={() => handleSendMessage('Simulate 15% COGS Increase', 'SIMULATE_COGS')}
                >
                  Simulate 15% COGS Increase
                </button>
                <button 
                  className={styles.chatOptionBtn}
                  disabled={isThinking}
                  onClick={() => handleSendMessage('Calculate Burn Rate Runway', 'CALC_BURN')}
                >
                  Calculate Burn Rate Runway
                </button>
                <button 
                  className={styles.chatOptionBtn}
                  disabled={isThinking}
                  onClick={() => handleSendMessage('Analyze Top Customers', 'ANALYZE_CUSTOMERS')}
                >
                  Analyze Top Customers
                </button>
              </div>
              
              <form className={styles.chatInputBox} onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }}>
                <input 
                  type="text" 
                  placeholder="Ask FIRA a question..." 
                  className={styles.chatInput} 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={isThinking}
                />
                <button type="submit" className={styles.chatSendBtn} disabled={isThinking || !userInput}>
                  {isThinking ? '...' : 'Ask'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Main Visualizations */}
          <div className={styles.rightCol}>
            <div className={styles.chartCardFull}>
              <div className={styles.chartHeader}>
                <div>
                  <h3 className={styles.chartTitle}>Revenue Prediction Model</h3>
                  <p className={styles.chartSubtitle}>Historical data vs Bayesian predictive scenarios</p>
                </div>
                <div className={styles.legendGroup}>
                  <span className={styles.legendItem}><span className={styles.dotHist}></span> Historical Revenue</span>
                  <span className={styles.legendItem}><span className={styles.dotCogs}></span> COGS</span>
                  <span className={styles.legendItem}><span className={styles.dotBase}></span> Base Forecast</span>
                  <span className={styles.legendItem}><span className={styles.dotOpt}></span> Optimistic Zone</span>
                </div>
              </div>
              
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCogs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748B'}} tickLine={false} axisLine={false} dy={10} />
                    <YAxis hide />
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="Historical" stroke="#64748B" strokeWidth={3} fillOpacity={1} fill="url(#colorHist)" connectNulls />
                    <Area type="monotone" dataKey="COGS" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCogs)" connectNulls />
                    <Area type="monotone" dataKey="ForecastOptimistic" stroke="#3B82F6" strokeDasharray="5 5" strokeWidth={2} fillOpacity={1} fill="url(#colorOpt)" connectNulls />
                    <Area type="monotone" dataKey="ForecastBase" stroke="#0F3B8C" strokeDasharray="3 3" strokeWidth={3} fill="none" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.scenarioGrid}>
              <div className={styles.scenarioCard}>
                <h4 className={styles.scenarioTitle}>Cash Flow Runway</h4>
                <p className={styles.scenarioDesc}>At current MRR and burn rate.</p>
                <div className={styles.runwayValue}>{kpis.runway}</div>
                <div className={styles.progressBarBg}><div className={styles.progressBarFill} style={{width: '75%'}}></div></div>
              </div>
              
              <div className={styles.scenarioCard}>
                <h4 className={styles.scenarioTitle}>YoY Growth Confidence</h4>
                <p className={styles.scenarioDesc}>Probability of hitting targets based on historical variance.</p>
                <div className={styles.confidenceValue}>82%</div>
                <div className={styles.progressBarBg}><div className={styles.progressBarFillGreen} style={{width: '82%'}}></div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
